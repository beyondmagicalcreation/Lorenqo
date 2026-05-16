require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// API key check on startup
const _apiKey = process.env.OPENAI_API_KEY;
if (!_apiKey || _apiKey.startsWith('your_')) {
  console.warn('\x1b[33m⚠️  OPENAI_API_KEY niet ingesteld — vertalingen zijn uitgeschakeld.\x1b[0m');
} else if (!_apiKey.startsWith('sk-')) {
  console.warn('\x1b[31m✗ OPENAI_API_KEY ziet er ongeldig uit (moet beginnen met sk-). Controleer platform.openai.com\x1b[0m');
} else {
  console.log('\x1b[32m✓ OPENAI_API_KEY geladen (' + _apiKey.slice(0, 10) + '...)\x1b[0m');
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const {
  getMessages, insertMessage, updateTranslations, markMessagesRead, getParticipants,
  insertParticipant, setOnline, resetAllOnline, getParticipant, insertFile, getFiles, seedAdmins,
} = require('./db');
const { translateAll } = require('./translate');
const { verifyToken } = require('./auth');
const socketState = require('./socketState');
const projectsRouter = require('./routes/projects');
const authRouter = require('./routes/auth');
const adminsRouter = require('./routes/admins');
const { router: messagesRouter } = require('./routes/messages');
const { seed } = require('./seed');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(uploadDir)));
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/admins', adminsRouter);
app.use('/api/messages', messagesRouter);
app.get('/health', (req, res) => res.json({ status: 'ok', app: process.env.APP_NAME || 'Lorenqo' }));
app.get('/api/config', (req, res) => res.json({
  appName: process.env.APP_NAME || 'Lorenqo',
  appTagline: process.env.APP_TAGLINE || 'Language. Communication. Global.',
  supportEmail: process.env.SUPPORT_EMAIL || 'hello@lorenqo.app',
}));

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// ── Socket.io auth middleware ──────────────────────────────────────────────────

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authenticatie vereist'));
  try {
    socket.auth = verifyToken(token);
    next();
  } catch {
    next(new Error('Ongeldige token'));
  }
});

// ── Socket.io ─────────────────────────────────────────────────────────────────

// socketId → { participantId, projectId, role: 'contact' }
const socketMap = new Map();
// All connected admin socket IDs (supports multiple admins / multiple tabs)
const adminSocketIds = new Set();

socketState.init(io, adminSocketIds);

const ADMIN_COLORS = ['#E87B1E', '#3B82F6', '#3FB950', '#A855F7', '#EC4899', '#14B8A6'];
function adminColor(id) {
  if (!id || id === 'admin') return ADMIN_COLORS[0];
  let h = 0;
  for (const c of id) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return ADMIN_COLORS[Math.abs(h) % ADMIN_COLORS.length];
}

function emitToAdmins(event, data) {
  for (const sid of adminSocketIds) io.to(sid).emit(event, data);
}

function emitToThread(projectId, contactId, event, data) {
  // Admin channel: broadcast only to admins
  if (projectId === '__admin__') {
    emitToAdmins(event, data);
    return;
  }
  // Regular thread: send to the specific contact's socket(s)
  for (const [sid, info] of socketMap) {
    if (info.role === 'contact' && info.participantId === contactId && info.projectId === projectId) {
      io.to(sid).emit(event, data);
    }
  }
  // Always copy to all admins
  emitToAdmins(event, data);
}

io.on('connection', (socket) => {
  const auth = socket.auth;

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (auth.role === 'admin') {
    adminSocketIds.add(socket.id);
    const adminName = auth.name || 'Admin';
    const adminId = auth.id || 'admin';
    const color = auth.avatarColor || adminColor(adminId);
    console.log(`Admin connected: ${adminName} (${socket.id})`);

    // Admin requests contacts for a project
    socket.on('join-project', async ({ projectId }) => {
      try {
        if (projectId === '__admin__') return; // no participants list for admin channel
        const participants = await getParticipants(projectId);
        socket.emit('participants-update', { projectId, participants });
      } catch (err) {
        console.error('join-project (admin):', err.message);
      }
    });

    // Admin loads a specific contact's thread (or admin channel)
    socket.on('get-thread', async ({ projectId, contactId }) => {
      try {
        const messages = await getMessages(projectId, contactId);
        socket.emit('thread-history', { contactId, messages });
        if (projectId !== '__admin__') {
          const files = await getFiles(projectId);
          socket.emit('file-list', files);
        }
      } catch (err) {
        console.error('get-thread:', err.message);
      }
    });

    // Admin sends a message into a contact thread or the admin channel
    socket.on('send-message', async ({ projectId, targetContactId, content, language }) => {
      const adminLang = language || 'nl';
      const id = uuidv4();
      const msgData = {
        id, project_id: projectId, sender_id: adminId, contact_id: targetContactId,
        content_original: content,
        content_nl: null, content_ma_arab: null, content_ma_franco: null, content_fr: null,
        type: 'text', file_name: null, file_size: null, file_path: null,
      };
      await insertMessage(msgData);

      if (projectId === '__admin__') {
        // Admin channel — no translation, just broadcast to all admins
        const enriched = { ...msgData, sender_name: adminName, sender_language: adminLang, avatar_color: color };
        emitToAdmins('message-received', enriched);
        return;
      }

      const enriched = { ...msgData, sender_name: adminName, sender_language: adminLang, avatar_color: color, translating: true };
      emitToThread(projectId, targetContactId, 'message-received', enriched);

      try {
        const translations = await translateAll(content, adminLang);
        await updateTranslations({ ...translations, id });
        emitToThread(projectId, targetContactId, 'message-translated', { id, ...translations });
      } catch (err) {
        console.error('Translation failed (admin):', err.message);
      }
    });

    // Admin sends a file into a contact's thread
    socket.on('file-message', async ({ projectId, targetContactId, fileName, fileSize, filePath, type }) => {
      const id = uuidv4();
      const msgData = {
        id, project_id: projectId, sender_id: adminId, contact_id: targetContactId,
        content_original: null,
        content_nl: null, content_ma_arab: null, content_ma_franco: null, content_fr: null,
        type: type || 'file', file_name: fileName, file_size: fileSize, file_path: filePath,
      };
      await insertMessage(msgData);
      await insertFile(id, projectId, adminId, fileName, fileSize, filePath);

      const fullMsg = { ...msgData, sender_name: adminName, avatar_color: color };
      emitToThread(projectId, targetContactId, 'message-received', fullMsg);
      emitToThread(projectId, targetContactId, 'file-shared', { projectId, ...fullMsg });

      const files = await getFiles(projectId);
      emitToAdmins('file-list', files);
    });

    socket.on('typing', ({ projectId, targetContactId, isTyping }) => {
      for (const [sid, info] of socketMap) {
        if (info.role === 'contact' && info.participantId === targetContactId) {
          io.to(sid).emit('typing', { senderId: adminId, name: adminName, isTyping });
        }
      }
    });

    socket.on('disconnect', () => {
      adminSocketIds.delete(socket.id);
      console.log(`Admin disconnected: ${adminName} (${socket.id})`);
    });

    return;
  }

  // ── Contact ────────────────────────────────────────────────────────────────
  if (auth.role === 'contact') {
    const { id: participantId, projectId, name, language, avatarColor } = auth;
    socketMap.set(socket.id, { participantId, projectId, role: 'contact' });
    console.log(`Contact connected: ${name} (${socket.id})`);

    socket.on('join', async () => {
      try {
        await setOnline(1, participantId);
        await markMessagesRead(projectId, participantId);

        const messages = await getMessages(projectId, participantId);
        socket.emit('message-history', messages);

        const files = await getFiles(projectId);
        socket.emit('file-list', files);

        // Notify all admins of presence and read status
        emitToAdmins('user-online', { participantId, name, online: true, projectId });
        emitToAdmins('messages-read', { projectId, contactId: participantId });
        const participants = await getParticipants(projectId);
        emitToAdmins('participants-update', { projectId, participants });
      } catch (err) {
        console.error('join (contact):', err.message);
      }
    });

    socket.on('send-message', async ({ content }) => {
      const id = uuidv4();
      const msgData = {
        id, project_id: projectId, sender_id: participantId, contact_id: participantId,
        content_original: content,
        content_nl: null, content_ma_arab: null, content_ma_franco: null, content_fr: null,
        type: 'text', file_name: null, file_size: null, file_path: null,
      };
      await insertMessage(msgData);

      const enriched = { ...msgData, sender_name: name, sender_language: language, avatar_color: avatarColor || '#E87B1E', translating: true };
      emitToThread(projectId, participantId, 'message-received', enriched);

      try {
        const translations = await translateAll(content, language);
        await updateTranslations({ ...translations, id });
        emitToThread(projectId, participantId, 'message-translated', { id, ...translations });
      } catch (err) {
        console.error('Translation failed:', err.message);
      }
    });

    socket.on('file-message', async ({ fileName, fileSize, filePath, type }) => {
      const id = uuidv4();
      const msgData = {
        id, project_id: projectId, sender_id: participantId, contact_id: participantId,
        content_original: null,
        content_nl: null, content_ma_arab: null, content_ma_franco: null, content_fr: null,
        type: type || 'file', file_name: fileName, file_size: fileSize, file_path: filePath,
      };
      await insertMessage(msgData);
      await insertFile(id, projectId, participantId, fileName, fileSize, filePath);

      const sender = await getParticipant(participantId);
      const fullMsg = { ...msgData, sender_name: sender?.name || name, avatar_color: sender?.avatar_color || avatarColor };
      emitToThread(projectId, participantId, 'message-received', fullMsg);
      emitToThread(projectId, participantId, 'file-shared', { projectId, ...fullMsg });

      const files = await getFiles(projectId);
      socket.emit('file-list', files);
      emitToAdmins('file-list', files);
    });

    socket.on('typing', ({ isTyping }) => {
      emitToAdmins('typing', { senderId: participantId, name, isTyping, projectId, contactId: participantId });
    });

    socket.on('disconnect', async () => {
      socketMap.delete(socket.id);
      await setOnline(0, participantId);
      emitToAdmins('user-offline', { participantId, projectId });
      const participants = await getParticipants(projectId);
      emitToAdmins('participants-update', { projectId, participants });
      console.log(`Contact disconnected: ${name} (${socket.id})`);
    });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await seed();
  await seedAdmins();
  await resetAllOnline();
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => console.log(`${process.env.APP_NAME || 'Lorenqo'} server running on port ${PORT}`));
}

start().catch(console.error);

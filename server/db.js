const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const dbDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'data')
    : './data';
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const ds = {
  projects: Datastore.create({ filename: path.join(dbDir, 'projects.db'), autoload: true }),
  participants: Datastore.create({ filename: path.join(dbDir, 'participants.db'), autoload: true }),
  messages: Datastore.create({ filename: path.join(dbDir, 'messages.db'), autoload: true }),
  files: Datastore.create({ filename: path.join(dbDir, 'files.db'), autoload: true }),
  inviteTokens: Datastore.create({ filename: path.join(dbDir, 'invite_tokens.db'), autoload: true }),
  admins: Datastore.create({ filename: path.join(dbDir, 'admins.db'), autoload: true }),
};

ds.projects.ensureIndex({ fieldName: '_id', unique: true });
ds.participants.ensureIndex({ fieldName: '_id', unique: true });
ds.messages.ensureIndex({ fieldName: 'project_id' });
ds.messages.ensureIndex({ fieldName: 'contact_id' });
ds.files.ensureIndex({ fieldName: 'project_id' });
ds.inviteTokens.ensureIndex({ fieldName: 'token', unique: true });

// ── Projects ─────────────────────────────────────────────────────────────────

async function getProjects() {
  return ds.projects.find({}).sort({ created_at: -1 });
}

async function getProject(id) {
  return ds.projects.findOne({ _id: id });
}

async function insertProject(id, name) {
  const existing = await ds.projects.findOne({ _id: id });
  if (existing) return existing;
  return ds.projects.insert({ _id: id, name, created_at: Math.floor(Date.now() / 1000) });
}

async function updateProject(id, name) {
  return ds.projects.update({ _id: id }, { $set: { name } }, {});
}

// ── Participants (contacts) ──────────────────────────────────────────────────

async function getParticipants(projectId) {
  return ds.participants.find({ project_id: projectId });
}

async function getParticipant(id) {
  return ds.participants.findOne({ _id: id });
}

async function insertParticipant(id, projectId, name, language, avatarColor, status) {
  const existing = await ds.participants.findOne({ _id: id });
  if (existing) return existing;
  return ds.participants.insert({
    _id: id, project_id: projectId, name, language,
    avatar_color: avatarColor || '#E87B1E', online: 0,
    status: status || null,
    created_at: Math.floor(Date.now() / 1000),
  });
}

async function updateParticipantStatus(id, status) {
  return ds.participants.update({ _id: id }, { $set: { status } }, {});
}

async function setOnline(online, id) {
  return ds.participants.update({ _id: id }, { $set: { online } }, {});
}

async function resetAllOnline() {
  return ds.participants.update({}, { $set: { online: 0 } }, { multi: true });
}

async function deleteParticipantData(contactId) {
  await ds.messages.remove({ contact_id: contactId }, { multi: true });
  await ds.participants.remove({ _id: contactId }, {});
}

// ── Messages ─────────────────────────────────────────────────────────────────

async function getMessages(projectId, contactId = null) {
  const query = { project_id: projectId };
  if (contactId) query.contact_id = contactId;
  const msgs = await ds.messages.find(query).sort({ created_at: 1 });
  const ADMIN_COLORS = ['#E87B1E', '#3B82F6', '#3FB950', '#A855F7', '#EC4899', '#14B8A6'];
  function hashColor(id) {
    let h = 0;
    for (const c of (id || '')) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
    return ADMIN_COLORS[Math.abs(h) % ADMIN_COLORS.length];
  }

  const enriched = await Promise.all(msgs.map(async (m) => {
    let senderName = 'Admin';
    let senderLanguage = 'nl';
    let avatarColor = '#E87B1E';
    if (m.sender_id === 'admin') {
      // legacy single-admin messages
    } else if (m.sender_id?.startsWith('admin-')) {
      const raw = m.sender_id.slice(6);
      senderName = raw.charAt(0).toUpperCase() + raw.slice(1);
      avatarColor = hashColor(m.sender_id);
    } else {
      const sender = await ds.participants.findOne({ _id: m.sender_id });
      senderName = sender?.name || 'Unknown';
      senderLanguage = sender?.language || 'nl';
      avatarColor = sender?.avatar_color || '#E87B1E';
    }
    return { ...m, id: m._id, sender_name: senderName, sender_language: senderLanguage, avatar_color: avatarColor };
  }));
  return enriched;
}

async function insertMessage(data) {
  const doc = {
    _id: data.id,
    project_id: data.project_id,
    sender_id: data.sender_id,
    contact_id: data.contact_id,
    content_original: data.content_original || null,
    content_nl: data.content_nl || null,
    content_ma_arab: data.content_ma_arab || null,
    content_ma_franco: data.content_ma_franco || null,
    content_fr: data.content_fr || null,
    content_en: data.content_en || null,
    type: data.type || 'text',
    file_name: data.file_name || null,
    file_size: data.file_size || null,
    file_path: data.file_path || null,
    read_at: null,
    created_at: Math.floor(Date.now() / 1000),
  };
  return ds.messages.insert(doc);
}

async function updateTranslations({ id, content_nl, content_ma_arab, content_ma_franco, content_fr, content_en }) {
  return ds.messages.update({ _id: id }, { $set: { content_nl, content_ma_arab, content_ma_franco, content_fr, content_en: content_en || null } }, {});
}

async function markMessagesRead(projectId, contactId) {
  const now = Math.floor(Date.now() / 1000);
  return ds.messages.update(
    { project_id: projectId, contact_id: contactId, sender_id: { $ne: contactId }, read_at: null },
    { $set: { read_at: now } },
    { multi: true }
  );
}

async function getLastMessage(projectId) {
  const msgs = await ds.messages.find({ project_id: projectId }).sort({ created_at: -1 });
  if (!msgs.length) return null;
  const m = msgs[0];
  const sender = m.sender_id === 'admin' ? null : await ds.participants.findOne({ _id: m.sender_id });
  return { ...m, sender_name: sender?.name || (m.sender_id === 'admin' ? 'Admin' : '') };
}

// ── Files ─────────────────────────────────────────────────────────────────────

async function getFiles(projectId) {
  const files = await ds.files.find({ project_id: projectId }).sort({ created_at: -1 });
  const enriched = await Promise.all(files.slice(0, 20).map(async (f) => {
    const uploader = f.uploader_id === 'admin'
      ? { name: 'Admin' }
      : await ds.participants.findOne({ _id: f.uploader_id });
    return { ...f, id: f._id, uploader_name: uploader?.name || 'Unknown' };
  }));
  return enriched;
}

async function insertFile(id, projectId, uploaderId, fileName, fileSize, filePath) {
  return ds.files.insert({
    _id: id, project_id: projectId, uploader_id: uploaderId,
    file_name: fileName, file_size: fileSize, file_path: filePath,
    created_at: Math.floor(Date.now() / 1000),
  });
}

// ── Invite tokens ─────────────────────────────────────────────────────────────

async function insertInviteToken(projectId, contactName = null, contactLanguage = null) {
  const token = uuidv4();
  await ds.inviteTokens.insert({
    token, project_id: projectId,
    contact_name: contactName || null,
    contact_language: contactLanguage || null,
    participant_id: null,
    created_at: Math.floor(Date.now() / 1000),
  });
  return token;
}

async function getInviteToken(token) {
  return ds.inviteTokens.findOne({ token });
}

async function updateInviteTokenWithParticipant(token, participantId) {
  return ds.inviteTokens.update({ token }, { $set: { participant_id: participantId } }, {});
}

async function getInviteTokenForParticipant(participantId) {
  return ds.inviteTokens.findOne({ participant_id: participantId });
}

// ── Admins ────────────────────────────────────────────────────────────────────

async function getAdmins() {
  return ds.admins.find({}).sort({ created_at: 1 });
}

async function getAdminByName(name) {
  return ds.admins.findOne({ name_lower: name.toLowerCase() });
}

async function insertAdmin(name, password) {
  const id = `admin-${name.toLowerCase()}`;
  const existing = await ds.admins.findOne({ _id: id });
  if (existing) return null;
  return ds.admins.insert({
    _id: id, name, name_lower: name.toLowerCase(), password,
    created_at: Math.floor(Date.now() / 1000),
  });
}

async function deleteAdmin(id) {
  return ds.admins.remove({ _id: id }, {});
}

async function updateAdminPassword(id, password) {
  return ds.admins.update({ _id: id }, { $set: { password } }, {});
}

async function countAdmins() {
  return ds.admins.count({});
}

async function seedAdmins() {
  const count = await ds.admins.count({});
  if (count > 0) return;
  const raw = process.env.ADMIN_CREDENTIALS || '';
  for (const pair of raw.split(',')) {
    const idx = pair.indexOf(':');
    if (idx > 0) {
      const name = pair.slice(0, idx).trim();
      const pass = pair.slice(idx + 1).trim();
      if (name && pass) await insertAdmin(name, pass);
    }
  }
}

module.exports = {
  ds,
  getProjects, getProject, insertProject, updateProject,
  getParticipants, getParticipant, insertParticipant, updateParticipantStatus, setOnline, resetAllOnline,
  deleteParticipantData,
  getMessages, insertMessage, updateTranslations, markMessagesRead,
  getFiles, insertFile,
  getLastMessage,
  insertInviteToken, getInviteToken, updateInviteTokenWithParticipant, getInviteTokenForParticipant,
  getAdmins, getAdminByName, insertAdmin, deleteAdmin, updateAdminPassword, countAdmins, seedAdmins,
};

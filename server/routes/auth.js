const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getInviteToken, getProject, insertParticipant, getParticipant, updateInviteTokenWithParticipant, updateParticipantStatus, getAdminByName } = require('../db');
const { signToken } = require('../auth');

const router = express.Router();

const COLORS = ['#E87B1E', '#3B82F6', '#3FB950', '#A855F7', '#EC4899', '#14B8A6'];
const ADMIN_COLORS = ['#E87B1E', '#3B82F6', '#3FB950', '#A855F7', '#EC4899', '#14B8A6'];

function hashColor(id) {
  let h = 0;
  for (const c of (id || '')) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return ADMIN_COLORS[Math.abs(h) % ADMIN_COLORS.length];
}

// Parse ADMIN_CREDENTIALS=name:pass,name2:pass2
function parseAdminCredentials() {
  const raw = process.env.ADMIN_CREDENTIALS || '';
  const admins = {};
  for (const pair of raw.split(',')) {
    const idx = pair.indexOf(':');
    if (idx > 0) {
      const name = pair.slice(0, idx).trim();
      const pass = pair.slice(idx + 1).trim();
      if (name && pass) admins[name.toLowerCase()] = { name, pass };
    }
  }
  return admins;
}

// POST /api/auth/admin — name + password → admin JWT
router.post('/admin', async (req, res) => {
  const { name, password } = req.body;

  // Check NeDB admins collection first (UI-managed admins)
  try {
    const dbAdmin = await getAdminByName(name?.trim() || '');
    if (dbAdmin) {
      if (password !== dbAdmin.password) {
        return res.status(401).json({ error: 'Invalid name or password' });
      }
      const token = signToken({
        role: 'admin',
        id: dbAdmin._id,
        name: dbAdmin.name,
        avatarColor: hashColor(dbAdmin._id),
      });
      return res.json({ token });
    }
  } catch {
    // DB not ready yet — fall through to env-based auth
  }

  // Fall back to env var admins
  const admins = parseAdminCredentials();

  if (Object.keys(admins).length > 0) {
    const key = name?.trim().toLowerCase();
    const admin = admins[key];
    if (!admin || password !== admin.pass) {
      return res.status(401).json({ error: 'Invalid name or password' });
    }
    const adminId = `admin-${key}`;
    const token = signToken({
      role: 'admin',
      id: adminId,
      name: admin.name,
      avatarColor: hashColor(adminId),
    });
    return res.json({ token });
  }

  // Fallback: legacy ADMIN_PASSWORD (any name accepted)
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const adminName = name?.trim() || 'Admin';
  const adminId = adminName === 'Admin' ? 'admin' : `admin-${adminName.toLowerCase()}`;
  const token = signToken({
    role: 'admin',
    id: adminId,
    name: adminName,
    avatarColor: hashColor(adminId),
  });
  res.json({ token });
});

// GET /api/auth/validate/:token — check invite token before showing form
router.get('/validate/:token', async (req, res) => {
  try {
    const record = await getInviteToken(req.params.token);
    if (!record) return res.status(404).json({ error: 'Invalid or expired invitation link' });
    const project = await getProject(record.project_id);
    res.json({
      valid: true,
      projectId: record.project_id,
      projectName: project?.name,
      contactName: record.contact_name || null,
      contactLanguage: record.contact_language || null,
      // Tell client if this link is for an existing contact (re-login)
      isRelogin: !!record.participant_id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/contact — name+language+token → contact JWT
router.post('/contact', async (req, res) => {
  try {
    const { token, name, language } = req.body;
    if (!token || !language) {
      return res.status(400).json({ error: 'token and language are required' });
    }
    const record = await getInviteToken(token);
    if (!record) return res.status(404).json({ error: 'Invalid or expired invitation link' });

    // If this invite token is already linked to an existing participant → re-authenticate them
    if (record.participant_id) {
      const existing = await getParticipant(record.participant_id);
      if (existing) {
        // Clear 'invited' status when they actually join for the first time
        if (existing.status === 'invited') {
          await updateParticipantStatus(existing._id, null);
        }
        const project = await getProject(existing.project_id);
        const jwtToken = signToken({
          role: 'contact',
          id: existing._id,
          projectId: existing.project_id,
          projectName: project?.name || '',
          name: existing.name,
          language: existing.language,
          avatarColor: existing.avatar_color,
        });
        return res.json({ token: jwtToken, relogin: true });
      }
    }

    // First use of this invite link: require name
    if (!name?.trim()) {
      return res.status(400).json({ error: 'name is required for first login' });
    }

    const project = await getProject(record.project_id);
    const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const participantId = `contact-${uuidv4()}`;

    await insertParticipant(participantId, record.project_id, name.trim(), language, avatarColor);
    // Link this invite token to the participant so re-login works later
    await updateInviteTokenWithParticipant(token, participantId);

    const jwtToken = signToken({
      role: 'contact',
      id: participantId,
      projectId: record.project_id,
      projectName: project?.name || '',
      name: name.trim(),
      language,
      avatarColor,
    });
    res.json({ token: jwtToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

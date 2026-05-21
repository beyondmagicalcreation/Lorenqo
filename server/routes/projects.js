const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getProjects, getProject, insertProject, updateProject, getParticipants, getParticipant, getLastMessage, insertInviteToken, updateInviteTokenWithParticipant, getInviteTokenForParticipant, deleteParticipantData, insertParticipant, updateParticipantName } = require('../db');
const { requireAdmin } = require('../auth');
const { emitToAdmins } = require('../socketState');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const projects = await getProjects();
    const enriched = await Promise.all(projects.map(async (p) => {
      const participants = await getParticipants(p._id);
      const last = await getLastMessage(p._id);
      return { ...p, id: p._id, participants, lastMessage: last };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    const participants = await getParticipants(project._id);
    res.json({ ...project, id: project._id, participants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'naam verplicht' });
    const id = uuidv4();
    await insertProject(id, name);
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    await updateProject(req.params.id, name.trim());
    res.json({ id: req.params.id, name: name.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const INVITE_COLORS = ['#E87B1E', '#3B82F6', '#3FB950', '#A855F7', '#EC4899', '#14B8A6'];

// Generate a new invite token for a project (admin only)
router.post('/:id/invite', requireAdmin, async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project niet gevonden' });
    const { contactName, contactLanguage } = req.body;
    const token = await insertInviteToken(project._id, contactName || null, contactLanguage || null);
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    // If a name was provided, pre-create the participant so they appear in the sidebar immediately
    if (contactName?.trim()) {
      const participantId = `contact-${uuidv4()}`;
      const avatarColor = INVITE_COLORS[Math.floor(Math.random() * INVITE_COLORS.length)];
      await insertParticipant(participantId, project._id, contactName.trim(), contactLanguage || 'nl', avatarColor, 'invited');
      await updateInviteTokenWithParticipant(token, participantId);

      // Emit real-time update to all connected admins
      const participants = await getParticipants(project._id);
      emitToAdmins('participants-update', { projectId: project._id, participants });
    }

    res.json({ token, url: `/join/${token}`, fullUrl: `${appUrl}/join/${token}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get (or regenerate) the invite link for an existing contact (admin only)
router.get('/:projectId/contacts/:contactId/invite', requireAdmin, async (req, res) => {
  try {
    const { projectId, contactId } = req.params;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    // Look for an existing invite token linked to this participant
    const existing = await getInviteTokenForParticipant(contactId);
    if (existing) {
      return res.json({
        token: existing.token,
        url: `/join/${existing.token}`,
        fullUrl: `${appUrl}/join/${existing.token}`,
      });
    }

    // No token found — generate a new one and immediately link it to this participant
    const participant = await getParticipant(contactId);
    const newToken = await insertInviteToken(projectId, participant?.name, participant?.language);
    await updateInviteTokenWithParticipant(newToken, contactId);

    res.json({
      token: newToken,
      url: `/join/${newToken}`,
      fullUrl: `${appUrl}/join/${newToken}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename a contact (admin only)
router.put('/:projectId/contacts/:contactId', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    await updateParticipantName(req.params.contactId, name.trim());
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a contact and all their messages (admin only)
router.delete('/:projectId/contacts/:contactId', requireAdmin, async (req, res) => {
  try {
    await deleteParticipantData(req.params.contactId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

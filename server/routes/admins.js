const express = require('express');
const { getAdmins, insertAdmin, deleteAdmin, updateAdminPassword, countAdmins } = require('../db');
const { requireAdmin } = require('../auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const admins = await getAdmins();
    res.json(admins.map((a) => ({ id: a._id, name: a.name, created_at: a.created_at })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name?.trim() || !password?.trim()) return res.status(400).json({ error: 'Name and password required' });
    const result = await insertAdmin(name.trim(), password.trim());
    if (!result) return res.status(409).json({ error: 'Admin already exists' });
    res.status(201).json({ id: result._id, name: result.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const count = await countAdmins();
    if (count <= 1) return res.status(400).json({ error: 'Cannot delete the last admin' });
    await deleteAdmin(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/password', requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password?.trim()) return res.status(400).json({ error: 'Password required' });
    await updateAdminPassword(req.params.id, password.trim());
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

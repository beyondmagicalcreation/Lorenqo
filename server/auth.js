const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'limitless-change-this-in-production';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Niet ingelogd' });
  try {
    req.auth = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Ongeldige token' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Geen toegang' });
    next();
  });
}

module.exports = { signToken, verifyToken, requireAuth, requireAdmin };

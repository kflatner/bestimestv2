// backend/routes/users.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const bcrypt = require('bcrypt');
const looksLikeBcrypt = h => /^\$2[aby]\$/.test(String(h || ''));


const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, Date.now() + ext.toLowerCase());
  }
});
const upload = multer({ storage });

/* GET all users */
router.get('/', (_req, res) => {
  const users = db.get('users').value();
  res.json(users);
});

/* PUT /api/users/:id/avatar */
router.put('/:id/avatar', upload.single('avatar'), (req, res) => {
  const id = Number(req.params.id);
  const users = db.get('users').value();
  const u = users.find(x => Number(x.id) === id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const publicUrl = `/uploads/${req.file.filename}`;
  u.image = publicUrl;

  // propagate to competitions
  const comps = db.get('competitions').value();
  comps.forEach(c => {
    (c.players || []).forEach(p => {
      if (Number(p.id) === id) p.image = publicUrl;
    });
  });

  db.write();
  res.json({ user: { id: u.id, username: u.username, image: u.image } });
});

// POST /api/users/:id/password  body: { oldPassword, newPassword }
router.post('/:id/password', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Mangler felt' });
    }
    if (String(newPassword).length < 12) {
      return res.status(400).json({ error: 'Nytt passord må være minst 12 tegn' });
    }

    // ✅ work with plain arrays (consistent with your other routes)
    const users = db.get('users').value();
    const user = users.find(u => Number(u.id) === id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const stored = String(user.password || '');
    const ok = looksLikeBcrypt(stored)
      ? await bcrypt.compare(String(oldPassword), stored)   // hashed case
      : String(oldPassword) === stored;                     // legacy plain text

    if (!ok) return res.status(401).json({ error: 'Feil gammelt passord' });

    // ✅ hash and save
    user.password = await bcrypt.hash(String(newPassword), 12);
    db.write(); // same style you use in avatar/username routes

    return res.json({ ok: true });
  } catch (err) {
    console.error('change-password error:', err);
    return res.status(500).json({ error: 'Serverfeil' });
  }
});



/* PUT /api/users/:id/username { username } */
router.put('/:id/username', (req, res) => {
  const id = Number(req.params.id);
  const { username } = req.body || {};
  if (!username || String(username).trim() === '') {
    return res.status(400).json({ error: 'Tomt brukernavn' });
  }

  const users = db.get('users').value();
  const u = users.find(x => Number(x.id) === id);
  if (!u) return res.status(404).json({ error: 'User not found' });

  u.username = String(username).trim();

  // propagate to competitions
  const comps = db.get('competitions').value();
  comps.forEach(c => {
    (c.players || []).forEach(p => {
      if (Number(p.id) === id) p.username = u.username;
    });
  });

  db.write();
  res.json({ user: { id: u.id, username: u.username, image: u.image } });
});

/* GET /api/users/:id/history */
router.get('/:id/history', (req, res) => {
  const id = Number(req.params.id);
  const users = db.get('users').value();
  const u = users.find(x => Number(x.id) === id);
  if (!u) return res.status(404).json({ error: 'User not found' });

  const history = Array.isArray(u.history) ? u.history : [];
  res.json(history);
});

module.exports = router;

// backend/routes/users.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');            // ✅ add this
const db = require('../db');

const router = express.Router();
const looksLikeBcrypt = h => /^\$2[aby]\$/.test(String(h || '')); // ✅ legacy check

// ... your avatar/username routes stay the same ...

// POST /api/users/:id/password  body: { oldPassword, newPassword }
router.post('/:id/password', async (req, res) => {
  const id = Number(req.params.id);
  console.log('[pw-change] start id=', id);

  try {
    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword) {
      console.warn('[pw-change] missing fields');
      return res.status(400).json({ error: 'Mangler felt' });
    }
    if (String(newPassword).length < 12) {
      console.warn('[pw-change] weak new password');
      return res.status(400).json({ error: 'Nytt passord må være minst 12 tegn' });
    }

    const users = db.get('users').value();
    const user = users.find(u => Number(u.id) === id);
    if (!user) {
      console.warn('[pw-change] user not found');
      return res.status(404).json({ error: 'User not found' });
    }

    const stored = String(user.password || '');
    console.log('[pw-change] storedPrefix=', stored.slice(0, 4)); // "$2b$" means bcrypt

    let ok = false;
    try {
      ok = looksLikeBcrypt(stored)
        ? await bcrypt.compare(String(oldPassword), stored) // hashed case
        : String(oldPassword) === stored;                   // legacy plain text
    } catch (cmpErr) {
      console.error('[pw-change] compare threw:', cmpErr);
      return res.status(500).json({ error: 'Compare failed' });
    }

    if (!ok) {
      console.warn('[pw-change] wrong old password');
      return res.status(401).json({ error: 'Feil gammelt passord' });
    }

    const newHash = await bcrypt.hash(String(newPassword), 12);
    db.get('users')
      .find(u => Number(u.id) === id) // avoid type mismatch
      .assign({ password: newHash })
      .write();

    console.log('[pw-change] success id=', id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[pw-change] error:', err);
    return res.status(500).json({ error: 'Serverfeil' });
  }
});






router.post('/login', async (req, res) => {
  try {
    let { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Mangler brukernavn eller passord' });
    }
    username = String(username).trim();
    password = String(password);

    const users = db.get('users').value();
    const user = users.find(u => u.username === username);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Ugyldig brukernavn eller passord' });
    }

    let ok = false;
    if (looksLikeBcrypt(user.password)) {
      ok = await bcrypt.compare(password, user.password);
    } else {
      // legacy plain text (from earlier bug) – allow login once
      ok = password === String(user.password);
    }

    if (!ok) {
      return res.status(401).json({ error: 'Ugyldig brukernavn eller passord' });
    }

    const { password: _ignored, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    console.error('auth/login error:', err);
    return res.status(500).json({ error: 'Serverfeil' });
  }
});


// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    let { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Mangler brukernavn eller passord' });
    }
    username = String(username).trim(); // optionally: .toLowerCase()
    password = String(password);

    if (password.length < 12) {
      return res.status(400).json({ error: 'Passord må være minst 12 tegn' });
    }

    const users = db.get('users').value();
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'Brukernavn er opptatt' });
    }

    const hash = await bcrypt.hash(password, 12);
    const newUser = {
      id: Date.now(), // consider uuid in real apps
      username,
      password: hash,
      image: '/images/default.png',
    };

    db.get('users').push(newUser).write();

    const { password: _pw, ...safeUser } = newUser;
    return res.status(201).json(safeUser);
  } catch (err) {
    console.error('auth/register error:', err);
    return res.status(500).json({ error: 'Serverfeil' });
  }
});

module.exports = router;

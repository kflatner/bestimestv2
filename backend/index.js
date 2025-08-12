// backend/index.js
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/users', require('./routes/users'));
app.use('/api/competitions', require('./routes/competitions'));
app.use('/api/auth', require('./routes/auth'));


// frontend
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// SPA fallback
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

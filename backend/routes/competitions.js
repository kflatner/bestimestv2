// backend/routes/competitions.js
const express = require('express');
const db = require('../db');
const router = express.Router();

function ensureJoinCode(comp) {
  if (!comp.joinCode) comp.joinCode = Math.random().toString(36).substring(2,8).toUpperCase();
  return comp;
}
function enrichPlayersWithUsers(comp, users) {
  comp.players = (comp.players || []).map(p => {
    if (p.username && p.image !== undefined) return p;
    const u = users.find(x => Number(x.id) === Number(p.id));
    return u ? { id: u.id, username: u.username, image: u.image } : p;
  });
  return comp;
}

/* GET /api/competitions?userId=123 */
router.get('/', (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const users = db.get('users').value();
  const competitions = db.get('competitions').value();

  const mine = competitions
    .filter(c => Array.isArray(c.players) && c.players.some(p => Number(p.id) === userId))
    .map(c => {
      ensureJoinCode(c);
      return enrichPlayersWithUsers(c, users);
    });

  db.write();
  res.json(mine);
});

/* POST /api/competitions */
router.post('/', (req, res) => {
  const { name, userId, targetActivities } = req.body;
  const uid = Number(userId);
  const target = Math.max(1, Number(targetActivities) || 10);
  if (!name || !uid) return res.status(400).json({ error: 'Navn og bruker-ID må oppgis' });

  const users = db.get('users').value();
  const owner = users.find(u => Number(u.id) === uid);

  const newCompetition = {
    id: Date.now(),
    name: String(name).trim(),
    joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    players: owner
      ? [{ id: owner.id, username: owner.username, image: owner.image }]
      : [{ id: uid }],
    results: [],
    nextActivity: null,
    pastActivities: [],
    targetActivities: target,
    status: 'ongoing',
    winnerId: null,
    finishedAt: null,
  };

  db.get('competitions').value().push(newCompetition);
  db.write();
  res.status(201).json(newCompetition);
});

/* POST /api/competitions/join */
router.post('/join', (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const userId = Number(req.body.userId);
  if (!code || !userId) return res.status(400).json({ error: 'Kode og bruker-ID kreves' });

  const comps = db.get('competitions').value();
  const users = db.get('users').value();

  const comp = comps.find(c => c.joinCode === code);
  if (!comp) return res.status(404).json({ error: 'Fant ingen konkurranse med den koden' });

  const user = users.find(u => Number(u.id) === userId);
  if (!user) return res.status(404).json({ error: 'Bruker ikke funnet' });

  if (comp.players.some(p => Number(p.id) === userId)) {
    return res.status(400).json({ error: 'Brukeren er allerede med i konkurransen' });
  }

  comp.players.push({ id: user.id, username: user.username, image: user.image });
  db.write();
  res.json({ success: true, competition: comp });
});

/* GET /api/competitions/:id */
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const users = db.get('users').value();
  const comp = db.get('competitions').value().find(c => Number(c.id) === id);
  if (!comp) return res.status(404).json({ error: 'Competition not found' });

  ensureJoinCode(comp);
  enrichPlayersWithUsers(comp, users);
  db.write();
  res.json(comp);
});

/* POST /api/competitions/:id/next-activity */
router.post('/:id/next-activity', (req, res) => {
  const id = Number(req.params.id);
  const { hostId, sportId, customSport, date, time } = req.body;

  const comps = db.get('competitions').value();
  const comp = comps.find(c => Number(c.id) === id);
  if (!comp) return res.status(404).json({ error: 'Competition not found' });

  if (comp.status === 'finished') {
    return res.status(400).json({ error: 'Konkurransen er avsluttet' });
  }

  if (!hostId || (!sportId && !customSport) || !date || !time) {
    return res.status(400).json({ error: 'Mangler felter: hostId, sportId/customSport, date, time' });
  }

  comp.nextActivity = {
    hostId: Number(hostId),
    sportId: sportId != null ? Number(sportId) : null,
    customSport: customSport ?? null,
    date,
    time,
  };
  db.write();
  res.json({ success: true, competition: comp });
});

/* helpers for finish */
function tallyScores(players, results) {
  const scores = {};
  for (const p of players) scores[p.id] = 0;
  for (const r of results) {
    if (r.first  != null) scores[r.first]  = (scores[r.first]  || 0) + 3;
    if (r.second != null) scores[r.second] = (scores[r.second] || 0) + 2;
    if (r.third  != null) scores[r.third]  = (scores[r.third]  || 0) + 1;
  }
  return scores;
}
function placementsFromScores(scores) {
  const sorted = Object.entries(scores)
    .map(([id, pts]) => ({ id: Number(id), points: pts }))
    .sort((a,b) => b.points - a.points);

  let place = 1, lastPts = null;
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (lastPts === null) row.place = 1;
    else if (row.points === lastPts) row.place = place;
    else { place = i + 1; row.place = place; }
    lastPts = row.points;
  }
  return sorted;
}

/* POST /api/competitions/:id/results */
router.post('/:id/results', (req, res) => {
  const id = Number(req.params.id);
  const { first = null, second = null, third = null, location = '', weather = '', summary = '' } = req.body;

  const comps = db.get('competitions').value();
  const users = db.get('users').value();
  const comp = comps.find(c => Number(c.id) === id);
  if (!comp) return res.status(404).json({ error: 'Competition not found' });

  if (comp.status === 'finished') {
    return res.status(400).json({ error: 'Konkurransen er allerede avsluttet' });
  }

  const next = comp.nextActivity;
  if (!next) return res.status(400).json({ error: 'Ingen aktiv aktivitet å avslutte' });

  comp.results.push({
    activityId: next.sportId || Date.now(),
    customSport: next.customSport || null,
    first: first !== '' ? Number(first) : null,
    second: second !== '' ? Number(second) : null,
    third: third !== '' ? Number(third) : null,
    location, weather, summary,
  });

  comp.pastActivities = comp.pastActivities || [];
  comp.pastActivities.push(next);
  comp.nextActivity = null;

  // Finish?
  if (comp.targetActivities && comp.results.length >= comp.targetActivities) {
    const scores = tallyScores(comp.players, comp.results);
    const placed = placementsFromScores(scores);
    const winnerId = placed[0]?.id ?? null;

    comp.status = 'finished';
    comp.winnerId = winnerId;
    comp.finishedAt = new Date().toISOString();

    // write history on users
    placed.forEach(row => {
      const u = users.find(ux => Number(ux.id) === Number(row.id));
      if (!u) return;
      u.history = Array.isArray(u.history) ? u.history : [];
      u.history.push({
  competitionId: comp.id,
  competitionName: comp.name,
  finishedAt: comp.finishedAt,
  placement: row.place,       // <- standardized key
  points: row.points,
});

    });

    // remove from competitions
    const newList = comps.filter(c => Number(c.id) !== id);
    db.data.competitions = newList;   // <-- replace whole array
    db.write();

    return res.json({ finished: true, winnerId, competitionId: id });
  }

  db.write();
  res.json({ success: true, competition: comp });
});

module.exports = router;

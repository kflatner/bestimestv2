async function ensureUsersCache() {
  if (!Array.isArray(model.data.users) || model.data.users.length === 0) {
    try {
      const res = await fetch('/api/users');
      if (res.ok) model.data.users = await res.json();
    } catch {}
  }
}

function findUserById(id) {
  return (model.data.users || []).find(u => Number(u.id) === Number(id));
}

function getPlayerImage(id) {
  const user = findUserById(id);
  
  return user?.image || `/images/default.png`;
}

function fixImagePath(path) {
  if (!path) return '/images/default.png';
  if (path.startsWith('/')) return path;
  if (path.startsWith('images/')) return '/' + path;
  return path;
}


function calculatePoints(competition, playerId) {
  let pts = 0;
  for (const r of (competition.results || [])) {
    if (r.first === playerId) pts += 3;
    else if (r.second === playerId) pts += 2;
    else if (r.third === playerId) pts += 1;
  }
  return pts;
}

async function playerView() {
  const competition = model.data.currentCompetition;
  if (!competition) return '<p>Ingen konkurranse valgt</p>';

  
  await ensureUsersCache();

  const players = (competition.players || []).map(p => {
    const u = findUserById(p.id);
    return {
      ...p,
      username: p.username || u?.username || `Spiller ${p.id}`,
      image: u?.image, 
    };
  });

  let html = `
    <h2>${competition.name}</h2>
    <div class="player-list">
      ${players.map(p => `
        <div class="player-card" onclick="selectPlayer(${p.id})" style="cursor:pointer;">
          <img src="${fixImagePath(p.image || getPlayerImage(p.id))}" alt="${p.username}" />
          <p>${p.username}</p>
          <p>Poeng: ${calculatePoints(competition, p.id)}</p>
        </div>
      `).join('')}
    </div>
  `;

  if (competition.joinCode) {
    html += `
      <div class="join-code">
        <p>Konkurransekode: <strong id="joinCodeText">${competition.joinCode}</strong></p>
        <button onclick="copyJoinCode()">📋 Kopier kode</button>
      </div>
      <button class="back-btn" onclick="goToPage('competitionSelect')">⬅ Til dashboard</button>
    `;
  }

  return html;
}

function selectPlayer(playerId) {
  model.inputs.selectedPlayerId = Number(playerId);
  model.app.currentPage = 'playerInfo';
  updateView();
}

function copyJoinCode() {
  const el = document.getElementById('joinCodeText');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim())
    .then(() => alert('Koden er kopiert!'))
    .catch(() => alert('Klarte ikke å kopiere kode.'));
}

window.playerView = playerView;
window.selectPlayer = selectPlayer;
window.getPlayerImage = getPlayerImage; 
window.fixImagePath = fixImagePath;

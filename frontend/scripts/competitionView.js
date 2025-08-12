const API = '/api';

function competitionSelectViewHtml(competitions) {
  const user = model.app.loggedInUser;

  const items = (competitions || []).map(c => `
    <li>
      <button onclick="selectCompetition(${c.id})">${c.name}</button>
    </li>
  `).join('');

  return `
    <div class="welcome-grid">
      <div class="welcome-header">
        <h1>Velkommen, ${user?.username || ''}</h1>
        <img class="welcome-avatar" src="${user?.image || '/images/default.png'}" alt="avatar">
      </div>

      <div class="welcome-actions">
        <button class="stacked" onclick="showNewCompetitionForm()">➕ Ny konkurranse</button>
        <button class="stacked" onclick="showJoinCompetitionForm()">🔗 Bli med</button>
        <button class="stacked" onclick="goToPage('profile')">👤 Profil</button>
      </div>

      <div class="welcome-comps">
        <h2>Dine konkurranser</h2>
        <ul class="competition-list">
          ${items || '<li>Ingen konkurranser enda.</li>'}
        </ul>
      </div>

      <div class="welcome-upcoming">
        <h2>Kommende aktiviteter</h2>
        <div class="upcoming-grid" id="upcomingGrid"></div>
      </div>
    </div>
  `;
}

async function loadCompetitionSelectView() {
  const user = model.app.loggedInUser;
  if (!user) {
    document.getElementById('app').innerHTML = '<p>Du er ikke logget inn.</p>';
    return;
  }
  try {
    const res = await fetch(`${API}/competitions?userId=${user.id}`);
    if (!res.ok) throw new Error(await res.text());
    const competitions = await res.json();
    model.data.competitions = competitions;
    document.getElementById('app').innerHTML = competitionSelectViewHtml(competitions);
    renderUpcoming(competitions);
  } catch (e) {
    console.error(e);
    document.getElementById('app').innerHTML = '<p>Kunne ikke hente konkurranser.</p>';
  }
}

function renderUpcoming(comps) {
  const grid = document.getElementById('upcomingGrid');
  if (!grid) return;

  const activities = [];
  for (const c of comps || []) {
    if (c.nextActivity) {
      const actName = c.nextActivity.customSport ||
        (model.data.activities.find(a => a.id === c.nextActivity.sportId)?.sport) ||
        'Ukjent';
      activities.push({
        compId: c.id,
        compName: c.name,
        title: actName,
        host: (c.players.find(p => p.id === c.nextActivity.hostId)?.username) || 'Ukjent',
        date: c.nextActivity.date,
        time: c.nextActivity.time
      });
    }
  }

  if (activities.length === 0) {
    grid.innerHTML = '<p style="opacity:.8;">Ingen planlagte aktiviteter.</p>';
    return;
  }

  grid.innerHTML = activities.map(a => `
    <div class="upcoming-card">
      <div class="upcoming-title">${a.title}</div>
      <div class="upcoming-meta">
        <span>👤 ${a.host}</span>
        <span>📅 ${a.date}</span>
        <span>⏰ ${a.time}</span>
      </div>
      <div class="upcoming-comp">Konkurranse: ${a.compName}</div>
      <button onclick="selectCompetition(${a.compId})">Gå til</button>
    </div>
  `).join('');
}

function showNewCompetitionForm() {
  document.getElementById('app').innerHTML = `
    <div class="competition-form">
      <h2>Opprett ny konkurranse</h2>

      <label>Navn</label>
      <input id="newCompetitionName" placeholder="Navn på konkurransen">

      <label style="margin-top:.5rem;">Antall aktiviteter til vinner</label>
      <input id="newCompetitionTarget" type="number" min="1" step="1" value="10">

      <div style="margin-top:.8rem;">
        <button onclick="createCompetition()">Start</button>
        <button onclick="updateView()">Avbryt</button>
      </div>
    </div>
  `;
}

async function createCompetition() {
  const name = document.getElementById('newCompetitionName').value.trim();
  const target = Number(document.getElementById('newCompetitionTarget').value) || 10;
  const user = model.app.loggedInUser;
  if (!name) return alert('Skriv inn et navn');

  const res = await fetch(`${API}/competitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, userId: user.id, targetActivities: target })
  });
  if (!res.ok) {
    console.error(await res.text());
    return alert('Klarte ikke å lage konkurranse');
  }
  const comp = await res.json();
  model.data.currentCompetition = comp;
  model.app.activeCompetitionId = comp.id;
  model.app.currentPage = 'players';
  updateView();
}

function showJoinCompetitionForm() {
  document.getElementById('app').innerHTML = `
    <div class="competition-form">
      <h2>Bli med i konkurranse</h2>
      <input id="joinCodeInput" placeholder="Konkurransekode">
      <div style="margin-top:.8rem;">
        <button onclick="joinCompetition()">Bli med</button>
        <button onclick="updateView()">Avbryt</button>
      </div>
    </div>
  `;
}

async function joinCompetition() {
  const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
  const user = model.app.loggedInUser;
  if (!user || !code) return;

  try {
    const response = await fetch(`${API}/competitions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId: user.id })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    model.data.competitions.push(data.competition);
    model.app.activeCompetitionId = data.competition.id;
    model.data.currentCompetition = data.competition;
    model.app.currentPage = 'players';
    updateView();
  } catch (err) {
    alert("Feil: " + err.message);
  }
}

function selectCompetition(id) {
  const comp = (model.data.competitions || []).find(c => c.id === id);
  if (!comp) return;
  model.data.currentCompetition = comp;
  model.app.activeCompetitionId = id;
  model.app.currentPage = 'players';
  updateView();
}

window.loadCompetitionSelectView = loadCompetitionSelectView;
window.selectCompetition = selectCompetition;
window.showNewCompetitionForm = showNewCompetitionForm;
window.createCompetition = createCompetition;
window.showJoinCompetitionForm = showJoinCompetitionForm;
window.joinCompetition = joinCompetition;

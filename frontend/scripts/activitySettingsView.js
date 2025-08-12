async function activitySettingsView() {
  const comp = getActiveCompetition();
  if (!comp) return '<p>Ingen konkurranse valgt</p>';

  
  const players = await getPlayersWithNames(comp);

  let html = `<h2>Aktivitetsoppsett – ${comp.name}</h2>`;

  
  if (comp.nextActivity && !model.inputs.showResultForm) {
    const host = players.find(p => p.id === comp.nextActivity.hostId)?.username || 'Ukjent';
    const actName =
      model.data.activities.find(a => a.id === comp.nextActivity.sportId)?.sport ||
      comp.nextActivity.customSport ||
      'Ukjent';

    html += `
      <div class="activity-form">
        <h3>Kommende aktivitet</h3>
        <p><strong>${actName}</strong> arrangert av <strong>${host}</strong> den ${comp.nextActivity.date} kl ${comp.nextActivity.time}</p>
        <button type="button" onclick="openResultForm()">Avslutt og registrer resultat</button>
      </div>
    `;
  }

  
  if (!comp.nextActivity && !model.inputs.showPlanActivityForm) {
    html += `
      <div style="text-align:center; margin-top:1rem;">
        <button onclick="openPlanForm()">Planlegg ny aktivitet</button>
      </div>
    `;
  }

  
  if (model.inputs.showPlanActivityForm && !comp.nextActivity) {
    html += planActivityForm(players);
  }

  
  if (model.inputs.showResultForm && comp.nextActivity) {
    html += resultForm(players);
  }

  html += `<div style="text-align:center; margin-top:1rem;">
    <button onclick="goToPage('players')">🔙 Til spillere</button>
  </div>`;

  return html;
}

function openPlanForm() {
  
  model.inputs.newActivity = { hostId: null, sportId: null, date: '', time: '' };
  model.inputs.useCustomSport = false;
  model.inputs.customSport = '';
  model.inputs.showPlanActivityForm = true;
  updateView();
}

function openResultForm() {
  
  model.inputs.result = { first: null, second: null, third: null, location: '', weather: '', summary: '' };
  model.inputs.showResultForm = true;
  updateView();
}

function planActivityForm(players) {
  const activities = model.data.activities || [];
  const useCustom = !!model.inputs.useCustomSport;

  return `
    <div class="activity-form">
      <h3>Planlegg ny aktivitet</h3>

      <label for="host">Vert</label>
      <select id="host" onchange="model.inputs.newActivity.hostId = Number(this.value)">
        <option value="" disabled ${model.inputs.newActivity.hostId ? '' : 'selected'}>Velg vert</option>
        ${players.map(p => `<option value="${p.id}" ${p.id===model.inputs.newActivity.hostId?'selected':''}>${p.username}</option>`).join('')}
      </select>

      <label for="sport">Aktivitet</label>
      <select id="sport" onchange="model.inputs.newActivity.sportId = Number(this.value)">
        <option value="" disabled ${model.inputs.newActivity.sportId ? '' : 'selected'}>Velg aktivitet</option>
        ${activities.map(a => `<option value="${a.id}" ${a.id===model.inputs.newActivity.sportId?'selected':''}>${a.sport}</option>`).join('')}
      </select>

      <label style="display:flex; gap:.5rem; align-items:center; margin-top:.6rem;">
        <input type="checkbox" onchange="model.inputs.useCustomSport = this.checked; updateView()" ${useCustom ? 'checked' : ''}>
        Skriv inn egen aktivitet
      </label>

      ${useCustom ? `
        <label for="customSport">Ny aktivitet</label>
        <input id="customSport" type="text" placeholder="Aktivitetsnavn"
               value="${model.inputs.customSport || ''}"
               oninput="model.inputs.customSport = this.value" />
      ` : ''}

      <label for="date">Dato</label>
      <input id="date" type="date" value="${model.inputs.newActivity.date || ''}"
             onchange="model.inputs.newActivity.date = this.value">

      <label for="time">Tid</label>
      <input id="time" type="time" value="${model.inputs.newActivity.time || ''}"
             onchange="model.inputs.newActivity.time = this.value">

      <div style="margin-top:1rem; display:flex; gap:.5rem;">
        <button onclick="startNextActivity()">Start aktivitet</button>
        <button onclick="model.inputs.showPlanActivityForm = false; updateView()">Avbryt</button>
      </div>
    </div>
  `;
}

function resultForm(players) {
  const optionList = (selectedId) => [
    `<option value="" ${selectedId == null ? 'selected' : ''}>Ingen</option>`,
    ...players.map(p => `<option value="${p.id}" ${p.id===selectedId?'selected':''}>${p.username}</option>`)
  ].join('');

  return `
    <div class="activity-form">
      <h3>Registrer resultater</h3>

      <label for="firstPlace">1. plass</label>
      <select id="firstPlace" onchange="model.inputs.result.first = this.value ? Number(this.value) : null">
        <option value="" disabled ${model.inputs.result.first ? '' : 'selected'}>Velg spiller</option>
        ${players.map(p => `<option value="${p.id}" ${p.id===model.inputs.result.first?'selected':''}>${p.username}</option>`).join('')}
      </select>

      <label for="secondPlace">2. plass</label>
      <select id="secondPlace" onchange="model.inputs.result.second = this.value ? Number(this.value) : null">
        ${optionList(model.inputs.result.second)}
      </select>

      <label for="thirdPlace">3. plass</label>
      <select id="thirdPlace" onchange="model.inputs.result.third = this.value ? Number(this.value) : null">
        ${optionList(model.inputs.result.third)}
      </select>

      <label for="location">Sted</label>
      <input id="location" type="text" placeholder="Hvor foregikk det?"
             value="${model.inputs.result.location || ''}"
             oninput="model.inputs.result.location = this.value">

      <label for="weather">Vær</label>
      <input id="weather" type="text" placeholder="Hvordan var været?"
             value="${model.inputs.result.weather || ''}"
             oninput="model.inputs.result.weather = this.value">

      <label for="summary">Oppsummering</label>
      <textarea id="summary" placeholder="Kort oppsummering"
                oninput="model.inputs.result.summary = this.value">${model.inputs.result.summary || ''}</textarea>

      <div style="margin-top:1rem; display:flex; gap:.5rem;">
        <button onclick="submitResult()">Lagre og avslutt</button>
        <button onclick="model.inputs.showResultForm = false; updateView()">Avbryt</button>
      </div>
    </div>
  `;
}


async function startNextActivity() {
  const comp = getActiveCompetition();
  if (!comp) return;

  const { hostId, sportId, date, time } = model.inputs.newActivity;
  const customSport = model.inputs.useCustomSport ? (model.inputs.customSport || '').trim() : null;

  if (!hostId || (!sportId && !customSport) || !date || !time) {
    alert('Fyll inn alle feltene (vert, aktivitet, dato, tid).');
    return;
  }

  try {
    const res = await fetch(`/api/competitions/${comp.id}/next-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId, sportId: sportId || null, customSport, date, time })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Kunne ikke starte aktivitet');

    model.data.currentCompetition = data.competition;
    const idx = model.data.competitions.findIndex(c => c.id === data.competition.id);
    if (idx >= 0) model.data.competitions[idx] = data.competition;

    model.inputs.showPlanActivityForm = false;
    updateView();
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}


async function submitResult() {
  const comp = getActiveCompetition();
  if (!comp?.nextActivity) {
    alert('Ingen aktiv aktivitet å avslutte.');
    return;
  }

  const { first, second, third, location, weather, summary } = model.inputs.result;

  
  if (first == null) {
    alert('Velg 1. plass.');
    return;
  }

  try {
    const res = await fetch(`/api/competitions/${comp.id}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first: first ?? null,
        second: second ?? null,
        third: third ?? null,
        location, weather, summary
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Kunne ikke lagre resultat');

    if (data.finished) {
      
      model.data.currentCompetition = null;
      model.app.activeCompetitionId = null;
      model.data.competitions = (model.data.competitions || []).filter(c => c.id !== comp.id);

      const winnerName =
        (comp.players || []).find(p => p.id === data.winnerId)?.username || 'Ukjent';
      alert(`Konkurransen er avsluttet!\nVinner: ${winnerName}`);

      
      model.app.currentPage = 'competitionSelect';
      await updateView();
      return;
    }

    
    model.data.currentCompetition = data.competition;
    const idx = (model.data.competitions || []).findIndex(c => c.id === data.competition.id);
    if (idx >= 0) model.data.competitions[idx] = data.competition;

    model.inputs.showResultForm = false;
    updateView();
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}


async function getPlayersWithNames(comp) {
  const needEnrich = (comp.players || []).some(p => !p.username);
  if (!needEnrich) return comp.players || [];

 
  let users = model.data.users;
  if (!Array.isArray(users)) {
    try {
      const resp = await fetch('/api/users');
      users = await resp.json();
      model.data.users = users;
    } catch {
      users = [];
    }
  }

  return (comp.players || []).map(p => {
    if (p.username) return p;
    const u = users.find(x => Number(x.id) === Number(p.id));
    return u ? { id: p.id, username: u.username, image: u.image } : p;
  });
}


window.activitySettingsView = activitySettingsView;
window.openPlanForm = openPlanForm;
window.openResultForm = openResultForm;
window.startNextActivity = startNextActivity;
window.submitResult = submitResult;

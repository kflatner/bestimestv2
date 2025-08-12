function activitiesInfoView() {
  const comp = getActiveCompetition();
  if (!comp) return '<p>Ingen konkurranse valgt.</p>';

  const activityId = Number(model.inputs.selectedActivityId);
  if (!activityId) return '<p>Ingen aktivitet valgt.</p>';

  const activity = model.data.activities.find(a => a.id === activityId);
  const name = activity?.sport || 'Ukjent';

  const matches = (comp.results || []).filter(r => r.activityId === activityId);
  if (matches.length === 0) {
    return `
      <div class="content-section">
        <h2>${name}</h2>
        <p>Ingen resultater registrert for denne aktiviteten.</p>
        <button onclick="goToPage('activities')">⬅ Til aktiviteter</button>
      </div>
    `;
  }

  const cards = matches.map(r => {
    const first  = comp.players.find(p => p.id === r.first)?.username  || '–';
    const second = comp.players.find(p => p.id === r.second)?.username || '–';
    const third  = comp.players.find(p => p.id === r.third)?.username  || '–';
    const meta = [
      r.location ? `📍 ${r.location}` : '',
      r.weather  ? `☁️ ${r.weather}`  : '',
    ].filter(Boolean).join(' · ');

    return `
      <div class="upcoming-card">
        <div class="upcoming-title">${name}</div>
        <div class="upcoming-meta">
          <span>🥇 ${first}</span>
          <span>🥈 ${second}</span>
          <span>🥉 ${third}</span>
        </div>
        ${meta ? `<div class="upcoming-comp">${meta}</div>` : ''}
        ${r.summary ? `<p style="margin-top:.4rem;opacity:.9;">${r.summary}</p>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="content-section">
      <h2>${name}</h2>
      <div class="upcoming-grid">
        ${cards}
      </div>
      <br>
      <button onclick="goToPage('activities')">⬅ Til aktiviteter</button>
    </div>
  `;
}

async function submitResult() {
  const comp = getActiveCompetition();
  if (!comp?.nextActivity) {
    alert('Ingen aktiv aktivitet å avslutte.');
    return;
  }

  const { first, second, third, location, weather, summary } = model.inputs.result;

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
      model.data.competitions = (model.data.competitions || []).filter(c => c.id !== data.competitionId);

      
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

window.activitiesInfoView = activitiesInfoView;

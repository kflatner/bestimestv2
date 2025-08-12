function activitiesView() {
  const comp = getActiveCompetition();
  if (!comp) {
    return `
      <div class="content-section">
        <h2>Aktiviteter</h2>
        <p>Ingen konkurranse valgt.</p>
        <button onclick="goToPage('competitionSelect')">🔙 Velg konkurranse</button>
      </div>
    `;
  }

  
  if (!Array.isArray(comp.results) || comp.results.length === 0) {
    return `
      <div class="content-section">
        <h2>Aktiviteter – ${comp.name}</h2>
        <p>Ingen registrerte resultater ennå.</p>
        <button onclick="goToPage('players')">🔙 Til spillere</button>
      </div>
    `;
  }

  
  const lastIndexByActivity = {};
  const countByActivity = {};
  comp.results.forEach((r, i) => {
    if (!r.activityId) return;
    lastIndexByActivity[r.activityId] = i;
    countByActivity[r.activityId] = (countByActivity[r.activityId] || 0) + 1;
  });

  const rows = comp.results.map((r, i) => {
    const activity = model.data.activities.find(a => a.id === r.activityId);
    const activityName = r.customSport || activity?.sport || 'Ukjent';
    const first  = comp.players.find(p => p.id === r.first)?.username  || '–';
    const second = comp.players.find(p => p.id === r.second)?.username || '–';
    const third  = comp.players.find(p => p.id === r.third)?.username  || '–';
    const isLastOfMultiple = r.activityId && countByActivity[r.activityId] > 1 && i === lastIndexByActivity[r.activityId];

    return `
      <tr>
        <td>
          <span class="clickable-activity" onclick="selectActivity(${r.activityId})">${activityName}</span>
          ${isLastOfMultiple ? ' <span style="color:#ff7676;">Rematch</span>' : ''}
        </td>
        <td>${first}</td>
        <td>${second}</td>
        <td>${third}</td>
      </tr>
    `;
  }).join('');

  return `
  <div class="content-section scroll-card">
    <h2>Aktiviteter – ${comp.name}</h2>
    <div class="table-scroll">
      <table class="results-table">
        <tr>
          <th>Sport</th>
          <th>1. plass</th>
          <th>2. plass</th>
          <th>3. plass</th>
        </tr>
        ${rows}
      </table>
    </div>
    <br>
    <button onclick="goToPage('players')">🔙 Til spillere</button>
  </div>
`;

}

function selectActivity(activityId) {
  model.inputs.selectedActivityId = Number(activityId);
  model.app.currentPage = 'activitiesInfo';
  updateView();
}

window.activitiesView = activitiesView;
window.selectActivity = selectActivity;

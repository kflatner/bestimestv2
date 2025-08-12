async function updateView() {
  
  if (!model.app.loggedInUser && !['login', 'register'].includes(model.app.currentPage)) {
    model.app.currentPage = 'login';
  }

  let html = '';

  switch (model.app.currentPage) {
    case 'login':
      html = loginView();
      break;

    case 'register':
      html = registerView();
      break;

    case 'competitionSelect':
      await loadCompetitionSelectView(); 
      return;

    case 'players':
      html = await playerView();
      break;

    case 'playerInfo':
      html = await playerInfoView();
      break;

   
case 'activitySettings':
  html = await activitySettingsView();   
  break;


    case 'activity':
    case 'activities':
      html = activitiesView();
      break;

    case 'activitiesInfo':
      html = activitiesInfoView();
      break;

    case 'profile':
  html = await profileView(); 
  break;


    case 'rules':
      html = rulesView();
      break;

    default:
      html = loginView();
      break;
  }

  document.getElementById('app').innerHTML = html;
}


async function goToPage(pageName) {
  model.app.currentPage = pageName;
  await updateView();
}
window.goToPage = goToPage;


function logout() {
  model.app.loggedInUser = null;
  localStorage.removeItem('loggedInUser');
  model.app.currentPage = 'login';
  updateView();
}
window.logout = logout;


let activityPoll;
function startActivityPolling() {
  clearInterval(activityPoll);
  activityPoll = setInterval(async () => {
    const comp = model.data.currentCompetition;
    if (!comp) return;
    try {
      const res = await fetch(`/api/competitions/${comp.id}`);
      if (!res.ok) return;
      const fresh = await res.json();
      model.data.currentCompetition = fresh;
      const idx = model.data.competitions.findIndex(c => c.id === fresh.id);
      if (idx >= 0) model.data.competitions[idx] = fresh;

      if (model.app.currentPage === 'activitySettings') updateView();
    } catch {}
  }, 10000);
}
window.startActivityPolling = startActivityPolling;


(async function init() {
  const stored = localStorage.getItem('loggedInUser');
  model.app.loggedInUser = stored ? JSON.parse(stored) : null;

  model.app.currentPage = model.app.loggedInUser ? 'competitionSelect' : 'login';
  await updateView();

  if (model.data.currentCompetition) {
    startActivityPolling();
  }
})();

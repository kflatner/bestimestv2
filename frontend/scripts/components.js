function backButton(label = '⬅ Tilbake', targetPage = 'players') {
    return `<button onclick="model.app.currentPage = '${targetPage}'; updateView()">${label}</button>`;
}


function getActiveCompetition() {
  const id = model?.app?.activeCompetitionId;
  if (id) {
    const list = model?.data?.competitions || [];
    const found = list.find(c => c.id === id);
    if (found) return found;
  }
  return model?.data?.currentCompetition || null;
}
window.getActiveCompetition = getActiveCompetition;


function logoutButton() {
    if (!model.app.loggedInUser) return '';
    return `<button onclick="logout()">Logg ut (${model.app.loggedInUser.username})</button>`;
}
function logout() {
    model.app.loggedInUser = null;
    model.app.currentPage = 'login';
    updateView();
}
function changeViewOption(value) {
    model.inputs.viewOption = value;
    updateView();
}
async function goToPage(pageName) {
    model.app.currentPage = pageName;
    await updateView();
}




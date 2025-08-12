const API_URL = 'http://localhost:3000/api/users';

async function fetchUsers() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Kunne ikke hente brukere');
    return await response.json();
}

async function createUser(username) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    if (!response.ok) throw new Error('Kunne ikke lage bruker');
    return await response.json();
}
async function loadCompetitions() {
    const user = model.app.loggedInUser;
    if (!user) {
        console.warn("Bruker ikke logget inn");
        return;
    }

    const response = await fetch(`http://localhost:3000/api/competitions?userId=${user.id}`);
    const data = await response.json();

    if (response.ok) {
        model.data.competitions = data;
        model.app.currentPage = 'competitionSelect';
        updateView();
    } else {
        console.error("Feil ved henting av konkurranser:", data.error);
    }
}

function syncUserInPlayers(updatedUser) {
  if (!updatedUser?.id) return;

  
  (model.data.competitions || []).forEach(c => {
    (c.players || []).forEach(p => {
      if (Number(p.id) === Number(updatedUser.id)) {
        if (updatedUser.username) p.username = updatedUser.username;
        if (updatedUser.image)    p.image    = updatedUser.image;
      }
    });
  });

  
  const cur = model.data.currentCompetition;
  if (cur) {
    (cur.players || []).forEach(p => {
      if (Number(p.id) === Number(updatedUser.id)) {
        if (updatedUser.username) p.username = updatedUser.username;
        if (updatedUser.image)    p.image    = updatedUser.image;
      }
    });
  }
}
window.syncUserInPlayers = syncUserInPlayers;



async function playerInfoView() {
  const competition = getActiveCompetition();
  if (!competition) return '<p>Ingen konkurranse valgt.</p>';

  const playerId = Number(model.inputs.selectedPlayerId);
  if (!playerId) return '<p>Ingen spiller valgt.</p>';

  
  let player = (competition.players || []).find(p => Number(p.id) === playerId) || { id: playerId };

  
  if (!player.username || !player.image) {
    try {
      const resp = await fetch('/api/users');
      if (resp.ok) {
        const users = await resp.json();
        const u = users.find(x => Number(x.id) === playerId);
        if (u) {
          player = {
            id: playerId,
            username: player.username || u.username,
            image: player.image || u.image
          };
        }
      }
    } catch {  }
  }

  
  const username = player.username || 'Ukjent';
  const image = fixImagePath(player.image || fallbackImage(playerId));

  
  let score = 0;
  const wonActivities = [];
  for (const r of (competition.results || [])) {
    if (r.first === playerId) {
      let sportName = r.customSport;
      if (!sportName) {
        const act = model.data.activities.find(a => a.id === r.activityId);
        sportName = act?.sport || 'Ukjent';
      }
      wonActivities.push(sportName);
      score += 3;
    } else if (r.second === playerId) {
      score += 2;
    } else if (r.third === playerId) {
      score += 1;
    }
  }

  const uniqueWon = [...new Set(wonActivities)];
  const bestText = uniqueWon.length ? uniqueWon.join(', ') : 'Ikke best i noe... enda!';

  return `
    <div class="player-info-container">
      <img class="player-profile" src="${image}" alt="${username}">
      <h2>${username}</h2>
      <p>Poeng: <strong>${score}</strong></p>
      <p><strong>Best i:</strong> ${bestText}</p>
      <button onclick="goToPage('players')">⬅ Tilbake</button>
    </div>
  `;
}


function fallbackImage(id) {
  const map = {
    1: '/images/Kenneth2.png',
    2: '/images/Ola.png',
    3: '/images/Vujan2.png'
  };
  return map[id] || '/images/default.png';
}
function fixImagePath(path) {
  if (!path) return '/images/default.png';
  if (path.startsWith('/')) return path;
  if (path.startsWith('images/')) return '/' + path;
  return path;
}

window.playerInfoView = playerInfoView;

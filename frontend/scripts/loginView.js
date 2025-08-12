const API_BASE_URL = '/api';

function loginView() {
  return `
    <div class="login-container fade-in-seq">
         <h1 class="fi">Best i Mest</h1>

      <p class="login-summary fi">
    Compete with your friends in exciting activities and challenges!  
    Create and join multiple competitions, keep track of scores,  
    and see who’s the ultimate champion.  
    Plan events, record results, and watch the leaderboard change  
    in real time – all in one place!
    </p>
    
    <h2>Logg inn</h2>
      <label for="login-username">Brukernavn</label>
      <input id="login-username" name="username" type="text" autocomplete="username" />

      <label for="login-password">Passord</label>
      <input id="login-password" name="password" type="password" autocomplete="current-password" />

      <button id="login-btn" type="button" onclick="login()">Logg inn</button>
      <button type="button" onclick="goToPage('register')">Registrer ny bruker</button>
      <p id="login-error" style="color:#ff9e9e;"></p>

      
    </div>
  `;
}

async function login() {
  const username = document.getElementById('login-username')?.value?.trim();
  const password = document.getElementById('login-password')?.value || '';
  const err = document.getElementById('login-error');

  err.textContent = '';
  if (!username || !password) {
    err.textContent = 'Skriv inn brukernavn og passord.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const ct = response.headers.get('content-type') || '';
    if (!response.ok) {
      const msg = ct.includes('application/json')
        ? (await response.json()).error || 'Innlogging feilet'
        : await response.text();
      err.textContent = typeof msg === 'string' ? msg : 'Innlogging feilet';
      return;
    }

    if (!ct.includes('application/json')) {
      err.textContent = 'Serveren svarte ikke med JSON (sjekk /api/auth/login).';
      return;
    }

    const user = await response.json();

    model.app.loggedInUser = user;
    localStorage.setItem('loggedInUser', JSON.stringify(user));

  
    const compRes = await fetch(`${API_BASE_URL}/competitions?userId=${user.id}`);
    const comps = compRes.ok ? await compRes.json() : [];
    model.data.competitions = Array.isArray(comps) ? comps : [];

    model.app.currentPage = 'competitionSelect';
    updateView();
  } catch (e) {
    console.error(e);
    err.textContent = 'Nettverksfeil. Sjekk at serveren kjører.';
  }
}

window.loginView = loginView;
window.login = login;

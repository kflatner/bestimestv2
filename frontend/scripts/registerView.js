function registerView() {
  return `
    <div class="activity-form" style="max-width:520px;">
      <h2>Registrer ny bruker</h2>
      <label>Brukernavn</label>
      <input id="reg-username" />
      <label>Passord</label>
      <input id="reg-password" type="password" />
      <label>Bilde-URL (valgfritt)</label>
      <input id="reg-image" placeholder="/images/default.png" />
      <button onclick="register()">Registrer</button>
      <p>Har du allerede bruker? <button onclick="goToPage('login')">Logg inn</button></p>
    </div>
  `;
}

async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const image = document.getElementById('reg-image').value.trim();

  if (!username || !password) {
    alert('Skriv inn brukernavn og passord');
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        image: image || '/images/default.png'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Kunne ikke registrere bruker');
      return;
    }
    alert('Bruker opprettet! Logg inn.');
    goToPage('login');
  } catch (e) {
    console.error(e);
    alert('Nettverksfeil under registrering');
  }
}

window.registerView = registerView;
window.register = register;

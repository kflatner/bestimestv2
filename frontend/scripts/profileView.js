
async function profileView() {
  const user = model.app.loggedInUser;
  if (!user) return '<p>Du er ikke logget inn.</p>';

  
  let history = [];
  try {
    const res = await fetch(`/api/users/${user.id}/history`);
    if (res.ok) history = await res.json();
  } catch {}

  const historyHtml = (history && history.length)
    ? history.map(h => {
        const when = h.finishedAt ? new Date(h.finishedAt).toLocaleDateString() : '';
        const place = h.placement != null ? `${h.placement}. plass` : '—';
        const pts = (h.points != null) ? ` • ${h.points}p` : '';
        return `<li>
          <strong>${sanitize(h.competitionName || 'Ukjent konkurranse')}</strong>
          <br><small>${when} — ${place}${pts}</small>
        </li>`;
      }).join('')
    : '<li>Ingen historikk ennå.</li>';

  const img = (user.image || '/images/default.png') + cacheBust();

  return `
    <div class="profile-card scroll-card">
      <h2>Profil</h2>
      <div class="scroll-body">

        <img id="profilePreview" class="player-profile" src="${img}" alt="${escapeHtml(user.username)}">
        <p><strong>${escapeHtml(user.username)}</strong></p>

        <div style="margin-top:1rem;">
          <label for="avatarFile">Bytt profilbilde</label>
          <input id="avatarFile" type="file" accept="image/*" onchange="previewAvatar(event)">
          <button type="button" onclick="uploadAvatar()">Last opp</button>
          <p id="profile-error" style="color:#ff9e9e;"></p>
        </div>

        <hr style="margin:1.2rem 0; opacity:.3;" />

        <h3>Endre brukernavn</h3>
        <input id="newUsername" type="text" placeholder="Nytt brukernavn" value="${escapeAttr(user.username)}">
        <button onclick="changeUsername()">Oppdater brukernavn</button>
        <p id="username-msg" style="min-height:1em;"></p>

        <hr style="margin:1.2rem 0; opacity:.3;" />

        <h3>Endre passord</h3>
        <input id="oldPass" type="password" placeholder="Gammelt passord" autocomplete="current-password">
        <input id="newPass" type="password" placeholder="Nytt passord" autocomplete="new-password">
        <button onclick="changePassword()">Oppdater passord</button>

        <hr style="margin:1.2rem 0; opacity:.3;" />

        <h3>Historikk</h3>
        <ul class="history-list">
          ${historyHtml}
        </ul>

        <div style="margin-top:1rem;">
          <button onclick="goToPage('competitionSelect')">⬅ Til konkurranser</button>
        </div>
      </div>
    </div>
  `;
}


function cacheBust() { return `?t=${Date.now()}`; }

function sanitize(s){ return (s ?? '').toString().replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }
function escapeHtml(s){ return sanitize(s); }
function escapeAttr(s){ return sanitize(s).replace(/"/g,'&quot;'); }


function patchUserImageEverywhere(userId, newImage) {
  if (Array.isArray(model.data.competitions)) {
    model.data.competitions.forEach(c => {
      (c.players || []).forEach(p => {
        if (Number(p.id) === Number(userId)) p.image = newImage;
      });
    });
  }
  if (model.data.currentCompetition?.players) {
    model.data.currentCompetition.players.forEach(p => {
      if (Number(p.id) === Number(userId)) p.image = newImage;
    });
  }
  if (Array.isArray(model.data.users)) {
    const u = model.data.users.find(x => Number(x.id) === Number(userId));
    if (u) u.image = newImage;
  }
}


function previewAvatar(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = document.getElementById('profilePreview');
  if (img) img.src = url;
}

async function uploadAvatar() {
  const user = model.app.loggedInUser;
  const fileInput = document.getElementById('avatarFile');
  const errEl = document.getElementById('profile-error');
  errEl.textContent = '';

  if (!user?.id) return errEl && (errEl.textContent = 'Ingen innlogget bruker.');
  if (!fileInput?.files?.[0]) return errEl && (errEl.textContent = 'Velg et bilde først.');

  const form = new FormData();
  form.append('avatar', fileInput.files[0]); // must match multer.single('avatar')

  try {
    const res = await fetch(`/api/users/${user.id}/avatar`, { method: 'PUT', body: form });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      const msg = ct.includes('application/json') ? (await res.json()).error : await res.text();
      throw new Error(typeof msg === 'string' ? msg : 'Opplasting feilet');
    }
    const data = ct.includes('application/json') ? await res.json() : {};
    if (data?.user) {
      model.app.loggedInUser = { ...model.app.loggedInUser, ...data.user };
      localStorage.setItem('loggedInUser', JSON.stringify(model.app.loggedInUser));
      patchUserImageEverywhere(model.app.loggedInUser.id, model.app.loggedInUser.image);
      const imgEl = document.getElementById('profilePreview');
      if (imgEl) imgEl.src = model.app.loggedInUser.image + cacheBust();
      updateView();
    }
    alert('Profilbilde oppdatert!');
  } catch (e) {
    console.error(e);
    if (errEl) errEl.textContent = e.message || 'Opplasting feilet.';
  }
}


async function changeUsername() {
  const user = model.app.loggedInUser;
  const msg = document.getElementById('username-msg');
  if (!user?.id) return msg && (msg.textContent = 'Ingen innlogget bruker.');

  const newName = (document.getElementById('newUsername')?.value || '').trim();
  if (!newName) return msg && (msg.textContent = 'Skriv inn et navn.');

  try {
    const res = await fetch(`/api/users/${user.id}/username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Kunne ikke oppdatere brukernavn');

    
    model.app.loggedInUser = { ...model.app.loggedInUser, username: data.user.username };
    localStorage.setItem('loggedInUser', JSON.stringify(model.app.loggedInUser));

    
    if (Array.isArray(model.data.competitions)) {
      model.data.competitions.forEach(c => {
        (c.players || []).forEach(p => { if (p.id === user.id) p.username = data.user.username; });
      });
    }
    if (model.data.currentCompetition?.players) {
      model.data.currentCompetition.players.forEach(p => { if (p.id === user.id) p.username = data.user.username; });
    }
    if (Array.isArray(model.data.users)) {
      const u = model.data.users.find(x => x.id === user.id);
      if (u) u.username = data.user.username;
    }

    msg.style.color = '#9fffcf';
    msg.textContent = 'Brukernavn oppdatert!';
    updateView();
  } catch (e) {
    console.error(e);
    msg.style.color = '#ff9e9e';
    msg.textContent = e.message || 'Feil ved oppdatering.';
  }
}


async function changePassword() {
  const user = model.app.loggedInUser;
  if (!user) return;

  const oldPassword = document.getElementById('oldPass').value || '';
  const newPassword = document.getElementById('newPass').value || '';
  if (!oldPassword || !newPassword) return alert('Fyll ut begge feltene');
  if (newPassword.length < 12) return alert('Nytt passord må være minst 12 tegn');
  if (newPassword === oldPassword) return alert('Nytt passord må være forskjellig fra det gamle');

  try {
    const res = await fetch(`/api/users/${user.id}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : null;

    if (!res.ok) return alert((data && data.error) || 'Kunne ikke endre passord');

    alert('Passord oppdatert!');
    document.getElementById('oldPass').value = '';
    document.getElementById('newPass').value = '';
  } catch (e) {
    console.error('changePassword fetch error:', e);
    alert('Nettverksfeil under passordendring');
  }
}


/* ---------- expose ---------- */
window.profileView = profileView;
window.previewAvatar = previewAvatar;
window.uploadAvatar = uploadAvatar;
window.changePassword = changePassword;
window.changeUsername = changeUsername;

// ── SCHIMBĂ CU URL-UL TĂU DE PE RENDER ──
const API_URL = 'https://elpis-teatru.onrender.com/api';

// ── TOAST ──
const toast = {
  _init() {
    if (document.getElementById('_tc')) return;
    const c = document.createElement('div');
    c.id = '_tc'; c.className = 'toast-container';
    document.body.appendChild(c);
  },
  arata(msg, tip = 'info', ms = 4500) {
    this._init();
    const t = document.createElement('div');
    t.className = `toast ${tip}`;
    const ic = { succes:'✓ ', eroare:'✕ ', info:'ℹ ' };
    t.innerHTML = `<strong>${ic[tip]||''}</strong>${msg}`;
    document.getElementById('_tc').appendChild(t);
    setTimeout(() => { t.style.animation = 'slideOut .3s ease forwards'; setTimeout(() => t.remove(), 300); }, ms);
  },
  succes: (m) => toast.arata(m,'succes'),
  eroare: (m) => toast.arata(m,'eroare'),
  info:   (m) => toast.arata(m,'info'),
};

// ── AUTH ──
const auth = {
  getToken: () => localStorage.getItem('elpis_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('elpis_user')); } catch { return null; } },
  esteLogat:() => !!localStorage.getItem('elpis_token'),
  salveaza(token, user) {
    localStorage.setItem('elpis_token', token);
    localStorage.setItem('elpis_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('elpis_token');
    localStorage.removeItem('elpis_user');
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? '../index.html' : 'index.html';
  }
};

// ── API ──
const api = {
  async cerere(endpoint, opt = {}) {
    const cfg = {
      method: opt.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {})
      }
    };
    if (opt.body) cfg.body = typeof opt.body === 'string' ? opt.body : JSON.stringify(opt.body);

    let raspuns;
    try {
      raspuns = await fetch(`${API_URL}${endpoint}`, cfg);
    } catch (e) {
      throw new Error('Nu se poate conecta la server. Verifică conexiunea la internet.');
    }

    let date;
    try { date = await raspuns.json(); } catch { throw new Error('Răspuns invalid de la server.'); }

    if (!raspuns.ok) throw new Error(date.error || 'Eroare necunoscută');
    return date;
  },
  get:    (u)    => api.cerere(u),
  post:   (u, b) => api.cerere(u, { method: 'POST',   body: b }),
  put:    (u, b) => api.cerere(u, { method: 'PUT',    body: b }),
  delete: (u)    => api.cerere(u, { method: 'DELETE' }),
};

// ── NAVIGARE ──
function initNav() {
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('deschis');
  });

  // Marchează pagina activă
  const cale = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').replace(/^\.\.\//, '').replace(/^\.\//, '');
    if (href && cale.endsWith(href)) a.classList.add('activ');
  });

  actualizeazaNav();
}

function actualizeazaNav() {
  const btnAuth   = document.getElementById('btn-auth');
  const walletBtn = document.getElementById('btn-wallet');
  const inPages   = window.location.pathname.includes('/pages/');
  const walletHref = inPages ? 'wallet.html' : 'pages/wallet.html';

  if (auth.esteLogat()) {
    const user = auth.getUser();
    // Buton cont
    if (btnAuth) {
      btnAuth.textContent = user?.prenume || 'Cont';
      btnAuth.href = walletHref;
      btnAuth.onclick = null;
    }
    // Buton wallet (iconița portofel)
    if (walletBtn) {
      walletBtn.href = walletHref;
      walletBtn.style.display = 'inline-flex';
    }
  } else {
    if (btnAuth) {
      btnAuth.textContent = 'Intră în cont';
      btnAuth.href = '#';
      btnAuth.onclick = (e) => { e.preventDefault(); deschideModal('login'); };
    }
    if (walletBtn) walletBtn.style.display = 'none';
  }
}

// ── MODAL AUTH ──
let stareModal = 'login';
let emailVerif = '';

function deschideModal(stare = 'login') {
  stareModal = stare;
  const ov = document.getElementById('modal-auth');
  if (!ov) return;
  ov.classList.add('activ');
  randeazaModal();
}
function inchideModal() { document.getElementById('modal-auth')?.classList.remove('activ'); }
function setStare(s) { stareModal = s; randeazaModal(); return false; }

function randeazaModal() {
  const el = document.getElementById('modal-continut');
  if (!el) return;

  const tpl = {
    login: `
      <span class="eyebrow">Cont existent</span>
      <h2 class="modal-titlu">Bun venit înapoi</h2>
      <p class="modal-sub">Intră în contul tău Elpis</p>
      <form id="fm-login">
        <div class="form-grup"><label>Email</label><input type="email" id="l-email" placeholder="adresa@email.com" required autocomplete="email"></div>
        <div class="form-grup"><label>Parolă</label><input type="password" id="l-parola" placeholder="••••••••" required autocomplete="current-password"></div>
        <div style="text-align:right;margin-bottom:14px"><a href="#" onclick="return setStare('reset-email')" style="color:var(--text-secundar);font-size:12px">Am uitat parola</a></div>
        <button type="submit" class="btn btn-primar btn-full" id="btn-login">Intră în cont</button>
      </form>
      <div class="modal-divider">sau</div>
      <button class="btn btn-ghost btn-full" onclick="setStare('inregistrare')">Creează cont nou</button>`,

    inregistrare: `
      <span class="eyebrow">Cont nou</span>
      <h2 class="modal-titlu">Alătură-te nouă</h2>
      <p class="modal-sub">Înregistrare gratuită</p>
      <form id="fm-reg">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-grup"><label>Prenume</label><input type="text" id="r-prenume" placeholder="Ion" required autocomplete="given-name"></div>
          <div class="form-grup"><label>Nume</label><input type="text" id="r-nume" placeholder="Popescu" required autocomplete="family-name"></div>
        </div>
        <div class="form-grup"><label>Email</label><input type="email" id="r-email" placeholder="adresa@email.com" required autocomplete="email"></div>
        <div class="form-grup"><label>Parolă (min. 8 caractere)</label><input type="password" id="r-parola" placeholder="••••••••" required autocomplete="new-password"></div>
        <button type="submit" class="btn btn-primar btn-full" id="btn-reg">Creează cont</button>
      </form>
      <div class="modal-divider">sau</div>
      <button class="btn btn-ghost btn-full" onclick="setStare('login')">Am deja cont</button>`,

    verifica: `
      <span class="eyebrow">Verificare email</span>
      <h2 class="modal-titlu">Introdu codul</h2>
      <p class="modal-sub">Am trimis un cod de 6 cifre la <strong style="color:var(--auriu)">${emailVerif}</strong></p>
      <form id="fm-verifica">
        <div class="form-grup">
          <label>Codul primit pe email</label>
          <input type="text" id="v-cod" placeholder="1 2 3 4 5 6" maxlength="6" inputmode="numeric"
            style="font-size:28px;letter-spacing:10px;text-align:center;font-weight:600" required>
        </div>
        <button type="submit" class="btn btn-primar btn-full" id="btn-verifica">Activează contul</button>
      </form>
      <div style="margin-top:14px;text-align:center">
        <a href="#" onclick="retrimiteCod();return false" style="color:var(--text-secundar);font-size:12px">Nu ai primit codul? Retrimite</a>
      </div>`,

    'reset-email': `
      <span class="eyebrow">Recuperare cont</span>
      <h2 class="modal-titlu">Ai uitat parola?</h2>
      <p class="modal-sub">Îți trimitem un cod de resetare pe email</p>
      <form id="fm-reset-email">
        <div class="form-grup"><label>Email-ul contului tău</label><input type="email" id="re-email" placeholder="adresa@email.com" required></div>
        <button type="submit" class="btn btn-primar btn-full">Trimite codul</button>
      </form>
      <div class="modal-divider"></div>
      <button class="btn btn-ghost btn-full" onclick="setStare('login')">← Înapoi la login</button>`,

    'reset-cod': `
      <span class="eyebrow">Resetare parolă</span>
      <h2 class="modal-titlu">Parolă nouă</h2>
      <p class="modal-sub">Codul a fost trimis la <strong style="color:var(--auriu)">${emailVerif}</strong></p>
      <form id="fm-reset-cod">
        <div class="form-grup"><label>Codul primit</label><input type="text" id="rc-cod" placeholder="123456" maxlength="6" style="letter-spacing:6px;text-align:center" required></div>
        <div class="form-grup"><label>Parola nouă (min. 8 caractere)</label><input type="password" id="rc-parola" placeholder="••••••••" required></div>
        <button type="submit" class="btn btn-primar btn-full">Schimbă parola</button>
      </form>`
  };

  el.innerHTML = tpl[stareModal] || tpl.login;
  atasaEventuri();
}

function atasaEventuri() {
  document.getElementById('fm-login')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('btn-login');
    btn.innerHTML = '<span class="spinner"></span>Se verifică...'; btn.disabled = true;
    try {
      const d = await api.post('/auth/login', {
        email: document.getElementById('l-email').value.trim(),
        parola: document.getElementById('l-parola').value
      });
      auth.salveaza(d.token, d.user);
      inchideModal();
      toast.succes(`Bun venit, ${d.user.prenume}!`);
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      if (err.message.includes('verificat')) {
        emailVerif = document.getElementById('l-email').value.trim();
        setStare('verifica');
        toast.info('Contul tău nu e verificat. Introdu codul din email.');
      } else {
        toast.eroare(err.message);
        btn.textContent = 'Intră în cont'; btn.disabled = false;
      }
    }
  });

  document.getElementById('fm-reg')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('btn-reg');
    btn.innerHTML = '<span class="spinner"></span>Se creează...'; btn.disabled = true;
    try {
      await api.post('/auth/inregistrare', {
        prenume: document.getElementById('r-prenume').value.trim(),
        nume:    document.getElementById('r-nume').value.trim(),
        email:   document.getElementById('r-email').value.trim(),
        parola:  document.getElementById('r-parola').value
      });
      emailVerif = document.getElementById('r-email').value.trim();
      setStare('verifica');
      toast.info('Cont creat! Verifică emailul pentru codul de 6 cifre.');
    } catch (err) {
      toast.eroare(err.message); btn.textContent = 'Creează cont'; btn.disabled = false;
    }
  });

  document.getElementById('fm-verifica')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('btn-verifica');
    btn.innerHTML = '<span class="spinner"></span>Se verifică...'; btn.disabled = true;
    try {
      const d = await api.post('/auth/verifica-cod', {
        email: emailVerif,
        cod: document.getElementById('v-cod').value.trim()
      });
      auth.salveaza(d.token, d.user);
      inchideModal();
      toast.succes('Cont verificat! Bun venit la Trupa Elpis!');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      toast.eroare(err.message); btn.textContent = 'Activează contul'; btn.disabled = false;
    }
  });

  document.getElementById('fm-reset-email')?.addEventListener('submit', async e => {
    e.preventDefault();
    emailVerif = document.getElementById('re-email').value.trim();
    try {
      await api.post('/auth/am-uitat-parola', { email: emailVerif });
      setStare('reset-cod');
      toast.info('Dacă emailul există, vei primi un cod.');
    } catch (err) { toast.eroare(err.message); }
  });

  document.getElementById('fm-reset-cod')?.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api.post('/auth/reseteaza-parola', {
        email: emailVerif,
        cod: document.getElementById('rc-cod').value.trim(),
        parolaNoua: document.getElementById('rc-parola').value
      });
      toast.succes('Parola schimbată! Te poți loga acum.');
      setStare('login');
    } catch (err) { toast.eroare(err.message); }
  });
}

async function retrimiteCod() {
  try { await api.post('/auth/retrimite-cod', { email: emailVerif }); toast.succes('Cod nou trimis!'); }
  catch (err) { toast.eroare(err.message); }
}

// ── UTILS DATE ──
function formateazaData(d) {
  return new Date(d).toLocaleDateString('ro-RO', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}
function formateazaOra(d) {
  return new Date(d).toLocaleTimeString('ro-RO', { hour:'2-digit', minute:'2-digit' });
}
function esteInTrecut(d) { return new Date(d) < new Date(); }

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  document.getElementById('modal-auth')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) inchideModal();
  });
  document.getElementById('btn-logout')?.addEventListener('click', e => {
    e.preventDefault(); auth.logout();
  });
});

# 🎭 Trupa de Teatru Elpis Constanța — Site Oficial v3

---

## 📁 Structura proiectului

```
elpis-v3/
├── frontend/                  ← Site-ul (GitHub Pages)
│   ├── index.html             ← Pagina principală (animație cortină + particule)
│   ├── css/
│   │   ├── stil.css           ← Stiluri globale
│   │   └── cortina.css        ← Animația cortinei
│   ├── js/
│   │   ├── app.js             ← Logică API, auth, navigare
│   │   └── cortina.js         ← Cortina (o dată per sesiune)
│   └── pages/
│       ├── spectacole.html    ← Spectacole + rezervare
│       ├── wallet.html        ← Biletele mele
│       ├── despre.html        ← Despre trupă
│       └── contact.html       ← Contact
│
├── backend/                   ← Serverul (Render.com)
│   ├── server.js
│   ├── .env.example
│   ├── config/email.js        ← Emailuri automate SendGrid
│   ├── models/                ← User, Spectacol, Rezervare, Bilet, SiteContent
│   ├── routes/                ← auth, spectacole, rezervari, bilete, user, site
│   └── middleware/auth.js
│
└── .github/workflows/
    └── deploy.yml             ← Deploy automat GitHub Pages
```

---

## 🚀 PASUL 1 — Creează conturile (toate gratuite)

### GitHub
1. **https://github.com** → Sign up
2. New repository → nume: `elpis-teatru` → Public → Create

### MongoDB Atlas
1. **https://www.mongodb.com/atlas** → Try Free
2. Creează cluster gratuit **M0 Free**
3. **Database Access** → Add New User:
   - Username: `elpis-admin` | Password: (generează și salvează!)
   - Role: **Atlas Admin**
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
5. **Clusters** → Connect → Drivers → copiază connection string:
   ```
   mongodb+srv://elpis-admin:PAROLA@cluster0.xxxxx.mongodb.net/elpis-teatru
   ```

### SendGrid
1. **https://sendgrid.com** → Start For Free
2. **Settings → API Keys → Create API Key** → Full Access → copiază cheia `SG.xxx`
3. **Settings → Sender Authentication → Single Sender Verification**
   - Completează cu emailul de la care trimite site-ul
   - Verifică emailul primit de la SendGrid ✅

### Render.com
1. **https://render.com** → Sign up with GitHub

### UptimeRobot
1. **https://uptimerobot.com** → Register for FREE

---

## 🔧 PASUL 2 — Configurează backend local

```bash
cd backend
npm install
```

Copiază `.env.example` → redenumește în `.env` și completează:

```env
MONGODB_URI=mongodb+srv://elpis-admin:PAROLA_TA@cluster0.xxxxx.mongodb.net/elpis-teatru
JWT_SECRET=ElpisConstanta2024_schimba_cu_ceva_lung_si_random_minim32caractere!
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=https://USERNAME_TAU.github.io
SENDGRID_API_KEY=SG.cheia_ta_copiata_din_sendgrid
EMAIL_FROM=emailul_verificat_in_sendgrid@exemplu.com
EMAIL_FROM_NAME=Trupa de Teatru Elpis
NODE_ENV=production
```

Testează:
```bash
npm run dev
# ✅ Conectat la MongoDB Atlas
# 🎭 Server Elpis pornit pe portul 5000
```

---

## 📤 PASUL 3 — Urcă pe GitHub

```bash
git init
git add .
git commit -m "Trupa de Teatru Elpis - site oficial"
git branch -M main
git remote add origin https://github.com/USERNAME/elpis-teatru.git
git push -u origin main
```

**Activează GitHub Pages:**
- Repository → Settings → Pages → Source: **GitHub Actions** → Save
- Site-ul va fi la: `https://USERNAME.github.io/elpis-teatru/`

---

## ☁️ PASUL 4 — Deploy backend pe Render.com

1. Dashboard → **New → Web Service** → conectează repository GitHub
2. Configurare:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free**
3. **Environment Variables** — adaugă exact aceleași valori din `.env`:

| Cheie | Valoare |
|-------|---------|
| `MONGODB_URI` | string-ul MongoDB Atlas |
| `JWT_SECRET` | string-ul tău secret |
| `FRONTEND_URL` | `https://USERNAME.github.io` |
| `SENDGRID_API_KEY` | cheia `SG.xxx` |
| `EMAIL_FROM` | emailul verificat SendGrid |
| `EMAIL_FROM_NAME` | `Trupa de Teatru Elpis` |
| `NODE_ENV` | `production` |

4. **Create Web Service** → Render îți dă URL: `https://elpis-backend.onrender.com`

**Actualizează URL-ul în frontend:**
- Deschide `frontend/js/app.js` → **linia 2**:
```javascript
const API_URL = 'https://elpis-backend.onrender.com/api';
```
- Salvează → `git add . && git commit -m "URL backend" && git push`

---

## ⏰ PASUL 5 — UptimeRobot (server mereu activ)

1. **https://uptimerobot.com** → Add New Monitor
2. Monitor Type: **HTTP(s)**
3. URL: `https://elpis-backend.onrender.com/ping`
4. Interval: **5 minutes** → Create Monitor ✅

---

## 📧 CUM FUNCȚIONEAZĂ EMAILURILE AUTOMATE

Emailurile sunt trimise automat prin **SendGrid** în aceste situații:

| Eveniment | Ce primește utilizatorul |
|-----------|--------------------------|
| Creare cont | **Cod de 6 cifre** pentru verificare (valabil 15 min) |
| Verificare reușită | **Email de bun venit** cu instrucțiuni |
| Rezervare bilete | **Confirmare + PDF-urile biletelor** atașate (unul per participant) |
| Anulare rezervare | **Confirmare anulare** + biletele sunt eliberate automat |
| Parolă uitată | **Cod de resetare** de 6 cifre (valabil 10 min) |

### Cum configurezi emailurile:
1. Creează cont SendGrid și verifică sender-ul (Pasul 1)
2. Adaugă `SENDGRID_API_KEY` și `EMAIL_FROM` în Render Environment Variables
3. **Gata** — emailurile merg automat, nu trebuie configurat nimic altceva

### Cum schimbi textul din emailuri:
- Deschide `backend/config/email.js`
- Fiecare funcție corespunde unui tip de email:
  - `trimiteVerificare` → emailul cu codul de 6 cifre
  - `trimiteBunVenit` → emailul după activare cont
  - `trimiteConfirmareRezervare` → confirmarea rezervării cu PDF-uri
  - `trimiteAnulare` → anulare rezervare
  - `trimiteResetareParola` → resetare parolă
- Modifică textul din HTML și dă push pe GitHub

---

## 🗄️ CUM EDITEZI DATELE DIN MONGODB ATLAS

Mergi la **https://cloud.mongodb.com** → Clusters → **Browse Collections**

### Adaugă un spectacol nou:
Collections → **spectacole** → **Insert Document**:
```json
{
  "titlu": "Numele piesei",
  "descriere": "Descrierea completă a spectacolului...",
  "regizor": "Numele regizorului",
  "distribuie": ["Actor 1", "Actor 2"],
  "durata": 120,
  "gen": "Comedie",
  "data": { "$date": "2025-05-10T19:00:00.000Z" },
  "sala": "Sala Mare",
  "imagine": "https://link-imagine.jpg",
  "nrTotalBilete": 100,
  "nrBileteDisponibile": 100,
  "activ": true
}
```
✅ **Apare automat pe site imediat!**

**Valori acceptate pentru `gen`:**
`Comedie` | `Dramă` | `Tragedie` | `Musical` | `Teatru pentru copii` | `Contemporan` | `Clasic`

**Format dată:** `{ "$date": "YYYY-MM-DDTHH:MM:00.000Z" }` — atenție: ora e UTC, deci pentru ora 19:00 Romania (UTC+3) pune `T16:00:00.000Z`

### Dezactivează un spectacol (nu mai apare pe site):
Collections → spectacole → găsește spectacolul → **Edit** → schimbă:
```json
{ "activ": false }
```

### Modifică numărul de bilete disponibile:
Collections → spectacole → Edit → schimbă `nrBileteDisponibile` și `nrTotalBilete`

### Editează textele de pe site (descrieri, despre, etc.):
Collections → **sitecontents** → Insert Document:
```json
{
  "cheie": "despre_descriere",
  "valoare": "Noul text despre trupă...",
  "sectiune": "despre"
}
```

### Fă un utilizator admin:
Collections → **users** → găsește userul tău → Edit:
```json
{ "rol": "admin" }
```

---

## 🎟️ CUM ÎNCARCI BILETELE PDF

Biletele tale PDF (cu QR-urile deja pe ele) se încarcă prin comandă în terminal.

### 1. Obține token-ul de admin:
- Creează cont pe site → fă-te admin în MongoDB (vezi mai sus)
- Loghează-te pe site → F12 → Application → Local Storage → copiază `elpis_token`

### 2. Încarci PDF-urile pentru un spectacol:
```bash
curl -X POST https://elpis-backend.onrender.com/api/bilete/upload \
  -H "Authorization: Bearer TOKEN_COPIAT" \
  -F "spectacolId=ID_DIN_MONGODB" \
  -F 'coduri=["COD-QR-001","COD-QR-002","COD-QR-003"]' \
  -F "bilete=@/calea/catre/bilet1.pdf" \
  -F "bilete=@/calea/catre/bilet2.pdf" \
  -F "bilete=@/calea/catre/bilet3.pdf"
```

> **Important:** Ordinea PDF-urilor = ordinea codurilor QR. Primul PDF → primul cod.
> **ID-ul spectacolului:** MongoDB Atlas → Collections → spectacole → câmpul `_id`

---

## 🔄 Cum actualizezi site-ul (live, fără să-l oprești)

```bash
# Modifică orice fișier în VS Code, apoi:
git add .
git commit -m "descriere modificare"
git push
# ✅ Site-ul se actualizează automat în ~2 minute
```

---

## 🛠️ Ce schimbi în cod — referință rapidă

| Ce vrei să schimbi | Unde |
|--------------------|------|
| URL server backend | `frontend/js/app.js` → **linia 2** |
| Telefon, email contact | `frontend/pages/contact.html` |
| Interval orar telefon | `frontend/pages/contact.html` → clasa `.interval-tel` |
| Povestea trupei | `frontend/pages/despre.html` |
| Text emailuri automate | `backend/config/email.js` |
| Culori site | `frontend/css/stil.css` → secțiunea `:root` |
| Spectacole noi | MongoDB Atlas → Collections → spectacole |
| Texte site | MongoDB Atlas → Collections → sitecontents |

---

## ❓ Probleme frecvente

**"Fetch failed" la creare cont / login**
→ URL-ul din `app.js` linia 2 nu e corect
→ Backend-ul nu e pornit — verifică Render Dashboard → Logs
→ Variabilele de mediu din Render nu sunt completate corect

**Emailurile nu ajung**
→ Verifică că sender-ul e verificat în SendGrid (Single Sender Verification)
→ Verifică `SENDGRID_API_KEY` în Render Environment Variables
→ Caută în folderul Spam

**"Nu se poate conecta la MongoDB"**
→ Verifică `MONGODB_URI` în Render Environment Variables
→ Verifică că Network Access în Atlas are `0.0.0.0/0`

**Cortina apare de două ori / text dublu**
→ Șterge `sessionStorage` din browser: F12 → Application → Session Storage → Clear

**Navigarea între pagini nu funcționează local**
→ Nu deschide fișierele direct din File Explorer (file://)
→ Folosește: `npx serve frontend` în terminal

---

## 🔒 Securitate implementată

| Funcție | Status |
|---------|--------|
| Parole criptate (bcrypt) | ✅ |
| JWT tokens cu expirare 7 zile | ✅ |
| Verificare email la înregistrare | ✅ |
| Rate limiting (200 req/15min) | ✅ |
| Protecție brute force login (10/15min) | ✅ |
| Helmet.js (headere securitate HTTP) | ✅ |
| CORS configurat pentru domeniul tău | ✅ |
| Tranzacții atomice pentru bilete | ✅ |
| PDF-uri accesibile doar proprietarului | ✅ |

---

*Creat pentru Trupa de Teatru Elpis Constanța* 🎭

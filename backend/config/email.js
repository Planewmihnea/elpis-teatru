const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = {
  email: process.env.EMAIL_FROM || 'noreply@elpis.ro',
  name:  process.env.EMAIL_FROM_NAME || 'Trupa de Teatru Elpis'
};

const shell = (body) => `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#0f2744;font-family:Arial,sans-serif}
  .wrap{max-width:600px;margin:0 auto;padding:30px 20px}
  .card{background:#ffffff;border-radius:8px;overflow:hidden}
  .header{background:#0f2744;padding:30px;text-align:center;border-bottom:3px solid #c9a84c}
  .logo{font-family:Georgia,serif;font-size:28px;color:#ffffff;letter-spacing:8px}
  .logo-sub{font-size:10px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;margin-top:4px}
  .body{padding:36px 32px;color:#1a1a2e}
  .footer{background:#0f2744;padding:20px;text-align:center;color:#8899aa;font-size:12px}
  h2{color:#0f2744;font-size:22px;margin:0 0 16px}
  p{font-size:14px;line-height:1.7;color:#444;margin:0 0 14px}
  .cod-box{background:#f0f5ff;border:2px solid #c9a84c;border-radius:6px;padding:20px;text-align:center;margin:20px 0}
  .cod{font-size:40px;font-weight:bold;letter-spacing:10px;color:#0f2744}
  .cod-sub{font-size:12px;color:#888;margin-top:6px}
  .info-box{background:#f8f9ff;border-left:4px solid #0f2744;padding:16px 20px;margin:20px 0;border-radius:0 6px 6px 0}
  .info-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:13px}
  .info-label{color:#888}
  .info-val{color:#0f2744;font-weight:bold}
  .gold{color:#c9a84c;font-weight:bold}
  .btn{display:inline-block;background:#c9a84c;color:#0f2744!important;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:1px;margin-top:8px}
  .anulat-box{background:#fff5f5;border-left:4px solid #e74c3c;padding:16px 20px;margin:20px 0;border-radius:0 6px 6px 0}
  .success-box{background:#f0fff4;border-left:4px solid #27ae60;padding:16px 20px;margin:20px 0;border-radius:0 6px 6px 0}
</style></head>
<body><div class="wrap"><div class="card">
<div class="header">
  <div class="logo">ELPIS</div>
  <div class="logo-sub">Trupa de Teatru · Constanța</div>
</div>
<div class="body">${body}</div>
<div class="footer">© Trupa de Teatru Elpis Constanța<br>Acest email a fost trimis automat.</div>
</div></div></body></html>`;

// 1. Cod verificare cont nou
const trimiteVerificare = async (email, nume, prenume, cod) => {
  await sgMail.send({
    to: email, from: FROM,
    subject: `${cod} — Verifică-ți contul Elpis`,
    html: shell(`
      <h2>Bun venit, ${prenume}!</h2>
      <p>Îți mulțumim că te-ai alăturat comunității Trupei de Teatru Elpis Constanța.</p>
      <p>Introdu codul de mai jos pentru a-ți activa contul:</p>
      <div class="cod-box">
        <div class="cod">${cod}</div>
        <div class="cod-sub">Valabil 15 minute</div>
      </div>
      <p style="color:#888;font-size:12px">Dacă nu ai creat tu acest cont, ignoră acest email.</p>
    `)
  });
};

// 2. Bun venit după verificare
const trimiteBunVenit = async (email, nume, prenume) => {
  await sgMail.send({
    to: email, from: FROM,
    subject: 'Bun venit la Trupa de Teatru Elpis!',
    html: shell(`
      <h2>Contul tău este activ! 🎭</h2>
      <p>Dragă <strong>${prenume} ${nume}</strong>,</p>
      <p>Contul tău a fost verificat cu succes. Acum poți rezerva bilete la spectacolele noastre direct online.</p>
      <div class="success-box">
        <p style="margin:0;color:#27ae60;font-size:13px"><strong>Ce poți face acum:</strong><br>
        🎟️ Rezervă bilete la spectacole<br>
        👤 Gestionează rezervările din Wallet<br>
        ❌ Anulează rezervări dacă planurile se schimbă</p>
      </div>
      <p>Ne bucurăm să te avem alături. Te așteptăm la spectacol!</p>
    `)
  });
};

// 3. Confirmare rezervare + bilete PDF atașate
const trimiteConfirmareRezervare = async (email, numeUser, prenumeUser, rezervare, spectacol, bileteBuffer) => {
  const dataFormatata = new Date(spectacol.data).toLocaleDateString('ro-RO', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
  const ora = new Date(spectacol.data).toLocaleTimeString('ro-RO', { hour:'2-digit', minute:'2-digit' });

  const participantiList = rezervare.participanti
    .map((p, i) => `<div class="info-row"><span class="info-label">Participant ${i+1}</span><span class="info-val">${p.prenume} ${p.nume}</span></div>`)
    .join('');

  // Biletele PDF ca atașamente
  const attachments = bileteBuffer.map((b, i) => ({
    content: b.pdfData.toString('base64'),
    filename: `bilet-${i+1}-${rezervare.participanti[i]?.prenume}-${rezervare.participanti[i]?.nume}.pdf`,
    type: 'application/pdf',
    disposition: 'attachment'
  }));

  await sgMail.send({
    to: email, from: FROM,
    subject: `Rezervare confirmată — ${spectacol.titlu}`,
    html: shell(`
      <h2>Rezervare confirmată! 🎟️</h2>
      <p>Dragă <strong>${prenumeUser} ${numeUser}</strong>, rezervarea ta a fost înregistrată cu succes.</p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Spectacol</span><span class="info-val">${spectacol.titlu}</span></div>
        <div class="info-row"><span class="info-label">Data</span><span class="info-val">${dataFormatata}</span></div>
        <div class="info-row"><span class="info-label">Ora</span><span class="info-val">${ora}</span></div>
        <div class="info-row"><span class="info-label">Sala</span><span class="info-val">${spectacol.sala}</span></div>
        <div class="info-row"><span class="info-label">Număr bilete</span><span class="info-val gold">${rezervare.nrBilete}</span></div>
        ${participantiList}
        <div class="info-row"><span class="info-label">Cod rezervare</span><span class="info-val gold">#${rezervare._id.toString().slice(-8).toUpperCase()}</span></div>
      </div>
      <div class="success-box">
        <p style="margin:0;color:#27ae60;font-size:13px">📎 Biletele PDF sunt atașate acestui email. Fiecare bilet are un cod QR unic.<br>Le poți găsi și în <strong>Wallet-ul tău</strong> de pe site.</p>
      </div>
      <p>Prezintă codul QR de pe bilet la intrare. Te așteptăm!</p>
    `),
    attachments
  });
};

// 4. Anulare rezervare
const trimiteAnulare = async (email, numeUser, prenumeUser, rezervare, spectacol) => {
  const dataFormatata = new Date(spectacol.data).toLocaleDateString('ro-RO', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });

  await sgMail.send({
    to: email, from: FROM,
    subject: `Rezervare anulată — ${spectacol.titlu}`,
    html: shell(`
      <h2>Rezervare anulată</h2>
      <p>Dragă <strong>${prenumeUser} ${numeUser}</strong>,</p>
      <p>Rezervarea ta a fost anulată cu succes.</p>
      <div class="anulat-box">
        <div class="info-row"><span class="info-label">Spectacol</span><span class="info-val" style="text-decoration:line-through">${spectacol.titlu}</span></div>
        <div class="info-row"><span class="info-label">Data</span><span class="info-val">${dataFormatata}</span></div>
        <div class="info-row"><span class="info-label">Bilete anulate</span><span class="info-val">${rezervare.nrBilete}</span></div>
      </div>
      <div class="success-box">
        <p style="margin:0;color:#27ae60;font-size:13px">✅ Biletele au fost eliberate și sunt acum disponibile pentru alți spectatori.</p>
      </div>
      <p>Sperăm să te revedem la un spectacol viitor!</p>
    `)
  });
};

// 5. Resetare parolă
const trimiteResetareParola = async (email, prenume, cod) => {
  await sgMail.send({
    to: email, from: FROM,
    subject: `${cod} — Resetare parolă Elpis`,
    html: shell(`
      <h2>Resetare parolă</h2>
      <p>Dragă <strong>${prenume}</strong>, am primit o cerere de resetare a parolei.</p>
      <div class="cod-box">
        <div class="cod">${cod}</div>
        <div class="cod-sub">Valabil 10 minute</div>
      </div>
      <p style="color:#888;font-size:12px">Dacă nu ai solicitat tu resetarea, ignoră acest email. Parola rămâne neschimbată.</p>
    `)
  });
};

const trimiteNotificareContact = async (mesaj) => {
  await sgMail.send({
    to: process.env.EMAIL_FROM,
    from: FROM,
    subject: `Mesaj nou de contact: ${mesaj.subiect || 'Fără subiect'}`,
    html: shell(`
      <h2>Mesaj nou primit prin site</h2>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Nume</span><span class="info-val">${mesaj.nume}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-val">${mesaj.email}</span></div>
        <div class="info-row"><span class="info-label">Subiect</span><span class="info-val">${mesaj.subiect || '—'}</span></div>
      </div>
      <p><strong>Mesaj:</strong></p>
      <p style="background:#f8f9ff;padding:16px;border-radius:6px;white-space:pre-wrap">${mesaj.mesaj}</p>
      <p style="color:#888;font-size:12px">Poți răspunde direct la acest email — va ajunge la ${mesaj.email}.</p>
    `),
    replyTo: mesaj.email
  });
};

module.exports = {
  trimiteVerificare,
  trimiteBunVenit,
  trimiteConfirmareRezervare,
  trimiteAnulare,
  trimiteResetareParola,
  trimiteNotificareContact
};

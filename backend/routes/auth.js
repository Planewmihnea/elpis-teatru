const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { trimiteVerificare, trimiteBunVenit, trimiteResetareParola } = require('../config/email');

const router = express.Router();
const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/inregistrare
router.post('/inregistrare', async (req, res) => {
  try {
    const { nume, prenume, email, parola } = req.body;
    if (!nume || !prenume || !email || !parola)
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii.' });
    if (parola.length < 8)
      return res.status(400).json({ error: 'Parola trebuie să aibă minim 8 caractere.' });

    const existent = await User.findOne({ email: email.toLowerCase() });
    if (existent) return res.status(400).json({ error: 'Există deja un cont cu acest email.' });

    const user = new User({ nume, prenume, email, parola });
    const cod  = user.genereazaCodVerificare();
    await user.save();
    await trimiteVerificare(email, nume, prenume, cod);

    res.status(201).json({ success: true, message: 'Verifică emailul pentru codul de confirmare.', email });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email deja folosit.' });
    console.error(err);
    res.status(500).json({ error: 'Eroare la creare cont.' });
  }
});

// POST /api/auth/verifica-cod
router.post('/verifica-cod', async (req, res) => {
  try {
    const { email, cod } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+codVerificare +codVerificareExpira');
    if (!user) return res.status(404).json({ error: 'Email negăsit.' });
    if (user.verificat) return res.status(400).json({ error: 'Contul e deja verificat.' });
    if (user.codVerificare !== cod) return res.status(400).json({ error: 'Cod incorect.' });
    if (user.codVerificareExpira < Date.now()) return res.status(400).json({ error: 'Codul a expirat.' });

    user.verificat = true;
    user.codVerificare = undefined;
    user.codVerificareExpira = undefined;
    await user.save();
    await trimiteBunVenit(user.email, user.nume, user.prenume);

    res.json({ success: true, token: genToken(user._id),
      user: { id: user._id, nume: user.nume, prenume: user.prenume, email: user.email, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: 'Eroare verificare.' });
  }
});

// POST /api/auth/retrimite-cod
router.post('/retrimite-cod', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() })
      .select('+codVerificare +codVerificareExpira');
    if (!user || user.verificat) return res.json({ success: true });
    const cod = user.genereazaCodVerificare();
    await user.save();
    await trimiteVerificare(user.email, user.nume, user.prenume, cod);
    res.json({ success: true, message: 'Cod nou trimis.' });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, parola } = req.body;
    if (!email || !parola) return res.status(400).json({ error: 'Email și parola sunt obligatorii.' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+parola');
    if (!user || !(await user.verificaParola(parola)))
      return res.status(401).json({ error: 'Email sau parolă incorectă.' });
    if (!user.verificat)
      return res.status(401).json({ error: 'Contul nu este verificat.', neverificat: true, email: user.email });

    res.json({ success: true, token: genToken(user._id),
      user: { id: user._id, nume: user.nume, prenume: user.prenume, email: user.email, rol: user.rol } });
  } catch (err) { res.status(500).json({ error: 'Eroare login.' }); }
});

// POST /api/auth/am-uitat-parola
router.post('/am-uitat-parola', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (user) {
      const cod = user.genereazaCodResetare();
      await user.save();
      await trimiteResetareParola(user.email, user.prenume, cod);
    }
    res.json({ success: true, message: 'Dacă emailul există, vei primi un cod.' });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

// POST /api/auth/reseteaza-parola
router.post('/reseteaza-parola', async (req, res) => {
  try {
    const { email, cod, parolaNoua } = req.body;
    if (!parolaNoua || parolaNoua.length < 8)
      return res.status(400).json({ error: 'Parola trebuie să aibă minim 8 caractere.' });
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+codResetare +codResetareExpira');
    if (!user || user.codResetare !== cod || user.codResetareExpira < Date.now())
      return res.status(400).json({ error: 'Cod incorect sau expirat.' });
    user.parola = parolaNoua;
    user.codResetare = undefined;
    user.codResetareExpira = undefined;
    await user.save();
    res.json({ success: true, message: 'Parola schimbată cu succes!' });
  } catch (err) { res.status(500).json({ error: 'Eroare resetare.' }); }
});

module.exports = router;

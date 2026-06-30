const express = require('express');
const Mesaj   = require('../models/Mesaj');
const { trimiteNotificareContact } = require('../config/email');
const { protejeaza, doarAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/contact — trimite mesaj din formularul de contact
router.post('/', async (req, res) => {
  try {
    const { nume, email, subiect, mesaj } = req.body;

    if (!nume?.trim() || !email?.trim() || !mesaj?.trim())
      return res.status(400).json({ error: 'Numele, emailul și mesajul sunt obligatorii.' });

    const mesajNou = await Mesaj.create({
      nume: nume.trim(),
      email: email.trim(),
      subiect: subiect?.trim() || '',
      mesaj: mesaj.trim()
    });

    trimiteNotificareContact(mesajNou).catch(console.error);

    res.status(201).json({ success: true, message: 'Mesajul a fost trimis cu succes!' });
  } catch (err) {
    console.error('Eroare mesaj contact:', err);
    res.status(500).json({ error: 'Eroare la trimiterea mesajului. Încearcă din nou.' });
  }
});

// GET /api/contact — admin vede toate mesajele
router.get('/', protejeaza, doarAdmin, async (req, res) => {
  try {
    const mesaje = await Mesaj.find().sort({ createdAt: -1 });
    res.json({ success: true, mesaje });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

module.exports = router;
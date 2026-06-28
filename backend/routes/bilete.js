const express  = require('express');
const multer   = require('multer');
const Bilet    = require('../models/Bilet');
const { protejeaza, doarAdmin } = require('../middleware/auth');

const router  = express.Router();
// Stochează PDF-urile în memorie, le punem în MongoDB
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/bilete/upload — admin uploadează mai multe PDF-uri pentru un spectacol
// Se face cu: curl -X POST .../api/bilete/upload -H "Authorization: Bearer TOKEN"
//   -F "spectacolId=ID" -F "bilete=@bilet1.pdf" -F "bilete=@bilet2.pdf" ...
router.post('/upload', protejeaza, doarAdmin, upload.array('bilete', 500), async (req, res) => {
  try {
    const { spectacolId, coduri } = req.body;
    // coduri = JSON array cu codurile QR corespunzătoare fiecărui PDF, în ordine
    const listaCodeuri = coduri ? JSON.parse(coduri) : [];

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'Niciun fișier primit.' });

    const bilete = [];
    for (let i = 0; i < req.files.length; i++) {
      const f   = req.files[i];
      const cod = listaCodeuri[i] || `ELPIS-${Date.now()}-${i}`;
      const b   = await Bilet.create({
        spectacol:   spectacolId,
        codUnic:     cod,
        numarBilet:  `${String(i + 1).padStart(3, '0')}`,
        pdfData:     f.buffer,
        pdfNume:     f.originalname,
        atribuit:    false
      });
      bilete.push({ id: b._id, numar: b.numarBilet, cod: b.codUnic });
    }

    res.status(201).json({ success: true, uploadate: bilete.length, bilete });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare la upload bilete.' });
  }
});

// GET /api/bilete/pdf/:biletId — servește PDF-ul biletului (doar owner sau admin)
router.get('/pdf/:biletId', protejeaza, async (req, res) => {
  try {
    const bilet = await Bilet.findById(req.params.biletId);
    if (!bilet) return res.status(404).json({ error: 'Bilet negăsit.' });

    // Verifică că userul e proprietarul sau admin
    const Rezervare = require('../models/Rezervare');
    const esteAdmin = req.user.rol === 'admin';
    if (!esteAdmin) {
      const rez = await Rezervare.findOne({
        _id: bilet.rezervare,
        user: req.user._id
      });
      if (!rez) return res.status(403).json({ error: 'Acces interzis.' });
    }

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="bilet-${bilet.numarBilet}.pdf"`);
    res.send(bilet.pdfData);
  } catch (err) {
    res.status(500).json({ error: 'Eroare la descărcare bilet.' });
  }
});

// GET /api/bilete/stoc/:spectacolId — câte bilete neatribuite mai sunt (admin)
router.get('/stoc/:spectacolId', protejeaza, doarAdmin, async (req, res) => {
  try {
    const total      = await Bilet.countDocuments({ spectacol: req.params.spectacolId });
    const disponibil = await Bilet.countDocuments({ spectacol: req.params.spectacolId, atribuit: false });
    res.json({ success: true, total, disponibil, atribuite: total - disponibil });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

module.exports = router;

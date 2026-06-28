const express    = require('express');
const Spectacol  = require('../models/Spectacol');
const { protejeaza, doarAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/spectacole — toate spectacolele active
router.get('/', async (req, res) => {
  try {
    const spectacole = await Spectacol.find({ activ: true }).sort({ data: 1 });
    res.json({ success: true, spectacole });
  } catch (err) { res.status(500).json({ error: 'Eroare încărcare spectacole.' }); }
});

// GET /api/spectacole/:id
router.get('/:id', async (req, res) => {
  try {
    const s = await Spectacol.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Spectacolul nu există.' });
    res.json({ success: true, spectacol: s });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

// POST — doar admin (se face din MongoDB Atlas direct, dar lăsăm ruta)
router.post('/', protejeaza, doarAdmin, async (req, res) => {
  try {
    const s = await Spectacol.create(req.body);
    res.status(201).json({ success: true, spectacol: s });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT — doar admin
router.put('/:id', protejeaza, doarAdmin, async (req, res) => {
  try {
    const s = await Spectacol.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!s) return res.status(404).json({ error: 'Spectacolul nu există.' });
    res.json({ success: true, spectacol: s });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

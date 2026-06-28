const express     = require('express');
const SiteContent = require('../models/SiteContent');

const router = express.Router();

// GET /api/site/continut?sectiune=acasa
// Returnează tot conținutul editat din MongoDB Atlas
router.get('/continut', async (req, res) => {
  try {
    const query = req.query.sectiune ? { sectiune: req.query.sectiune } : {};
    const continut = await SiteContent.find(query);
    // Transformă în obiect { cheie: valoare }
    const rezultat = {};
    continut.forEach(c => { rezultat[c.cheie] = c.valoare; });
    res.json({ success: true, continut: rezultat });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

module.exports = router;

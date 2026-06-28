const express = require('express');
const User    = require('../models/User');
const { protejeaza } = require('../middleware/auth');

const router = express.Router();

// GET /api/user/profil
router.get('/profil', protejeaza, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

// PUT /api/user/schimba-parola
router.put('/schimba-parola', protejeaza, async (req, res) => {
  try {
    const { parolaVeche, parolaNoua } = req.body;
    if (!parolaNoua || parolaNoua.length < 8)
      return res.status(400).json({ error: 'Parola nouă trebuie să aibă minim 8 caractere.' });
    const user = await User.findById(req.user._id).select('+parola');
    if (!(await user.verificaParola(parolaVeche)))
      return res.status(400).json({ error: 'Parola veche este incorectă.' });
    user.parola = parolaNoua;
    await user.save();
    res.json({ success: true, message: 'Parola schimbată cu succes.' });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

module.exports = router;

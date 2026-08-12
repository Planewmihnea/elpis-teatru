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
// DELETE /api/user/sterge-cont
router.delete('/sterge-cont', protejeaza, async (req, res) => {
  try {
    const { parola } = req.query;
    if (!parola) return res.status(400).json({ error: 'Parola este obligatorie.' });

    const user = await User.findById(req.user._id).select('+parola');
    if (!(await user.verificaParola(parola)))
      return res.status(400).json({ error: 'Parola incorectă.' });

    // Șterge rezervările și biletele asociate
    const Rezervare = require('../models/Rezervare');
    const Bilet = require('../models/Bilet');
    const rezervari = await Rezervare.find({ user: req.user._id });
    for (const r of rezervari) {
      const idBilete = r.participanti.map(p => p.bilet).filter(Boolean);
      await Bilet.updateMany(
        { _id: { $in: idBilete } },
        { atribuit: false, rezervare: null, participant: { nume: null, prenume: null } }
      );
    }
    await Rezervare.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    res.json({ success: true, message: 'Contul a fost șters.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare la ștergerea contului.' });
  }
});
module.exports = router;

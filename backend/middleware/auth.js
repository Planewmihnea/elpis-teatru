const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protejeaza = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ error: 'Nu ești autentificat.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user)           return res.status(401).json({ error: 'Utilizatorul nu există.' });
    if (!user.verificat) return res.status(401).json({ error: 'Contul nu este verificat.', neverificat: true });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Sesiunea a expirat. Loghează-te din nou.' });
    return res.status(401).json({ error: 'Token invalid.' });
  }
};

const doarAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin')
    return res.status(403).json({ error: 'Acces permis doar administratorilor.' });
  next();
};

module.exports = { protejeaza, doarAdmin };

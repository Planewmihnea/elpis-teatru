require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const spectacoleRoutes = require('./routes/spectacole');
const rezervariRoutes  = require('./routes/rezervari');
const userRoutes       = require('./routes/user');
const biletRoutes      = require('./routes/bilete');
const siteRoutes       = require('./routes/site');

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

const limiter     = rateLimit({ windowMs: 15*60*1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10,
  message: { error: 'Prea multe încercări. Încearcă în 15 minute.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth',       authRoutes);
app.use('/api/spectacole', spectacoleRoutes);
app.use('/api/rezervari',  rezervariRoutes);
app.use('/api/user',       userRoutes);
app.use('/api/bilete',     biletRoutes);
app.use('/api/site',       siteRoutes);

// Health check pentru UptimeRobot
app.get('/ping', (req, res) => res.json({ status: 'online' }));

// Servește PDF bilet (protejat)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Eroare internă de server' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectat la MongoDB Atlas');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🎭 Server Elpis pornit pe portul ${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB:', err.message); process.exit(1); });

const mongoose = require('mongoose');

const mesajSchema = new mongoose.Schema({
  nume:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true, lowercase: true },
  subiect: { type: String, trim: true, default: '' },
  mesaj:   { type: String, required: true },
  citit:   { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mesaj', mesajSchema);
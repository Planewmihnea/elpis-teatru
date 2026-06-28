const mongoose = require('mongoose');

const rezervareSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spectacol:  { type: mongoose.Schema.Types.ObjectId, ref: 'Spectacol', required: true },
  participanti: [{
    nume:      { type: String, required: true },
    prenume:   { type: String, required: true },
    bilet:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bilet', default: null }
  }],
  nrBilete:   { type: Number, required: true, min: 1, max: 10 },
  status:     { type: String, enum: ['activa','anulata'], default: 'activa' },
  dataRezervare: { type: Date, default: Date.now },
  dataAnulare:   { type: Date, default: null }
});

rezervareSchema.index({ user: 1, status: 1 });
rezervareSchema.index({ spectacol: 1, status: 1 });

module.exports = mongoose.model('Rezervare', rezervareSchema);

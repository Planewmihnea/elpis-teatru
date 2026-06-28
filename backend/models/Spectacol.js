const mongoose = require('mongoose');

const spectacolSchema = new mongoose.Schema({
  titlu:       { type: String, required: true, trim: true },
  descriere:   { type: String, required: true },
  regizor:     { type: String, trim: true },
  distribuie:  [String],
  durata:      { type: Number, required: true },
  gen:         {
    type: String,
    enum: ['Comedie','Dramă','Tragedie','Musical','Teatru pentru copii','Contemporan','Clasic'],
    required: true
  },
  data:        { type: Date, required: true },
  sala:        { type: String, default: 'Sala Mare' },
  imagine:     { type: String, default: '' },
  // Bilete gestionate ca stoc de PDF-uri
  nrTotalBilete:      { type: Number, required: true, min: 1 },
  nrBileteDisponibile:{ type: Number, required: true },
  activ:       { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

// Setează automat biletele disponibile la creare
spectacolSchema.pre('save', function(next) {
  if (this.isNew) this.nrBileteDisponibile = this.nrTotalBilete;
  next();
});

// Status calculat automat
spectacolSchema.virtual('status').get(function() {
  if (!this.activ) return 'inactiv';
  if (new Date(this.data) < new Date()) return 'trecut';
  if (this.nrBileteDisponibile === 0) return 'complet';
  return 'disponibil';
});

module.exports = mongoose.model('Spectacol', spectacolSchema);

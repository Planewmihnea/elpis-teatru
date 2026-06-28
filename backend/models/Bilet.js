const mongoose = require('mongoose');

// Un bilet = un PDF unic stocat în MongoDB ca Buffer
const biletSchema = new mongoose.Schema({
  spectacol:   { type: mongoose.Schema.Types.ObjectId, ref: 'Spectacol', required: true },
  codUnic:     { type: String, required: true, unique: true }, // codul QR de pe PDF
  numarBilet:  { type: String, required: true },               // ex: "A-001"
  pdfData:     { type: Buffer, required: true },               // conținutul PDF-ului
  pdfNume:     { type: String, required: true },               // numele fișierului original
  // Atribuire
  rezervare:   { type: mongoose.Schema.Types.ObjectId, ref: 'Rezervare', default: null },
  participant: {
    nume:    { type: String, default: null },
    prenume: { type: String, default: null }
  },
  atribuit:    { type: Boolean, default: false },
  dataAtribuire: { type: Date, default: null },
  uploadat:    { type: Date, default: Date.now }
});

biletSchema.index({ spectacol: 1, atribuit: 1 });
biletSchema.index({ codUnic: 1 });

module.exports = mongoose.model('Bilet', biletSchema);

const mongoose = require('mongoose');

// Tot ce apare pe site și poate fi modificat din MongoDB Atlas
const siteContentSchema = new mongoose.Schema({
  cheie:    { type: String, required: true, unique: true }, // ex: "acasa_titlu"
  valoare:  { type: mongoose.Schema.Types.Mixed, required: true },
  sectiune: { type: String },  // ex: "acasa", "despre", "contact"
  updatedAt:{ type: Date, default: Date.now }
});

siteContentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SiteContent', siteContentSchema);

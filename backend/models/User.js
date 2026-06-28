const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nume:   { type: String, required: true, trim: true, maxlength: 50 },
  prenume:{ type: String, required: true, trim: true, maxlength: 50 },
  email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
  parola: { type: String, required: true, minlength: 8, select: false },
  rol:    { type: String, enum: ['user','admin'], default: 'user' },
  verificat: { type: Boolean, default: false },
  codVerificare:       { type: String, select: false },
  codVerificareExpira: { type: Date,   select: false },
  codResetare:         { type: String, select: false },
  codResetareExpira:   { type: Date,   select: false },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual('rezervari', {
  ref: 'Rezervare', localField: '_id', foreignField: 'user'
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('parola')) return next();
  this.parola = await bcrypt.hash(this.parola, 12);
  next();
});

userSchema.methods.verificaParola = async function(p) {
  return bcrypt.compare(p, this.parola);
};

userSchema.methods.genereazaCodVerificare = function() {
  const cod = Math.floor(100000 + Math.random() * 900000).toString();
  this.codVerificare       = cod;
  this.codVerificareExpira = new Date(Date.now() + 15 * 60 * 1000);
  return cod;
};

userSchema.methods.genereazaCodResetare = function() {
  const cod = Math.floor(100000 + Math.random() * 900000).toString();
  this.codResetare       = cod;
  this.codResetareExpira = new Date(Date.now() + 10 * 60 * 1000);
  return cod;
};

module.exports = mongoose.model('User', userSchema);

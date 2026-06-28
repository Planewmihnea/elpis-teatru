const express    = require('express');
const mongoose   = require('mongoose');
const Rezervare  = require('../models/Rezervare');
const Spectacol  = require('../models/Spectacol');
const Bilet      = require('../models/Bilet');
const { protejeaza } = require('../middleware/auth');
const { trimiteConfirmareRezervare, trimiteAnulare } = require('../config/email');

const router = express.Router();

// POST /api/rezervari — creează rezervare cu participanți
router.post('/', protejeaza, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { spectacolId, participanti } = req.body;
    // participanti = [{ nume: "Popescu", prenume: "Ion" }, ...]

    if (!participanti || !Array.isArray(participanti) || participanti.length === 0)
      return res.status(400).json({ error: 'Lista participanților este obligatorie.' });
    if (participanti.length > 10)
      return res.status(400).json({ error: 'Maxim 10 bilete per rezervare.' });

    // Validează fiecare participant
    for (const p of participanti) {
      if (!p.nume?.trim() || !p.prenume?.trim())
        return res.status(400).json({ error: 'Fiecare participant trebuie să aibă nume și prenume.' });
    }

    const spectacol = await Spectacol.findById(spectacolId).session(session);
    if (!spectacol) { await session.abortTransaction(); return res.status(404).json({ error: 'Spectacolul nu există.' }); }
    if (new Date(spectacol.data) < new Date()) { await session.abortTransaction(); return res.status(400).json({ error: 'Spectacolul a trecut.' }); }
    if (!spectacol.activ) { await session.abortTransaction(); return res.status(400).json({ error: 'Spectacolul nu este disponibil.' }); }

    const nrBilete = participanti.length;
    if (spectacol.nrBileteDisponibile < nrBilete) {
      await session.abortTransaction();
      return res.status(400).json({ error: `Bilete insuficiente. Disponibile: ${spectacol.nrBileteDisponibile}` });
    }

    // Verifică rezervare existentă
    const existent = await Rezervare.findOne({ user: req.user._id, spectacol: spectacolId, status: 'activa' }).session(session);
    if (existent) { await session.abortTransaction(); return res.status(400).json({ error: 'Ai deja o rezervare activă la acest spectacol.' }); }

    // Ia biletele PDF din stoc (neatribuite)
    const biletePDF = await Bilet.find({ spectacol: spectacolId, atribuit: false })
      .limit(nrBilete).session(session);

    if (biletePDF.length < nrBilete) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Nu sunt suficiente bilete PDF în stoc. Contactați organizatorii.' });
    }

    // Creează rezervarea
    const [rezervare] = await Rezervare.create([{
      user: req.user._id,
      spectacol: spectacolId,
      nrBilete,
      participanti: participanti.map((p, i) => ({
        nume: p.nume.trim(),
        prenume: p.prenume.trim(),
        bilet: biletePDF[i]._id
      }))
    }], { session });

    // Atribuie fiecare bilet PDF participantului
    for (let i = 0; i < biletePDF.length; i++) {
      await Bilet.findByIdAndUpdate(biletePDF[i]._id, {
        atribuit: true,
        rezervare: rezervare._id,
        participant: { nume: participanti[i].nume.trim(), prenume: participanti[i].prenume.trim() },
        dataAtribuire: new Date()
      }, { session });
    }

    // Scade biletele disponibile
    spectacol.nrBileteDisponibile -= nrBilete;
    await spectacol.save({ session });

    await session.commitTransaction();

    // Trimite email cu PDF-urile atașate (async)
    trimiteConfirmareRezervare(
      req.user.email,
      req.user.nume,
      req.user.prenume,
      rezervare,
      spectacol,
      biletePDF
    ).catch(console.error);

    // Returnează rezervarea cu biletele (fără pdfData pentru performanță)
    const rezervareCompleta = await Rezervare.findById(rezervare._id)
      .populate('spectacol', 'titlu data sala')
      .populate('participanti.bilet', 'codUnic numarBilet pdfNume');

    res.status(201).json({
      success: true,
      message: 'Rezervare creată! Biletele au fost trimise pe email.',
      rezervare: rezervareCompleta
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('Eroare rezervare:', err);
    res.status(500).json({ error: 'Eroare la crearea rezervării.' });
  } finally {
    session.endSession();
  }
});

// GET /api/rezervari/ale-mele
router.get('/ale-mele', protejeaza, async (req, res) => {
  try {
    const rezervari = await Rezervare.find({ user: req.user._id })
      .populate('spectacol', 'titlu data sala imagine gen')
      .populate('participanti.bilet', 'codUnic numarBilet pdfNume _id')
      .sort({ dataRezervare: -1 });
    res.json({ success: true, rezervari });
  } catch (err) { res.status(500).json({ error: 'Eroare.' }); }
});

// DELETE /api/rezervari/:id — anulare
router.delete('/:id', protejeaza, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const rezervare = await Rezervare.findById(req.params.id)
      .populate('spectacol')
      .session(session);

    if (!rezervare) { await session.abortTransaction(); return res.status(404).json({ error: 'Rezervarea nu există.' }); }
    if (rezervare.user.toString() !== req.user._id.toString()) { await session.abortTransaction(); return res.status(403).json({ error: 'Nu poți anula rezervarea altcuiva.' }); }
    if (rezervare.status === 'anulata') { await session.abortTransaction(); return res.status(400).json({ error: 'Rezervarea e deja anulată.' }); }
    if (new Date(rezervare.spectacol.data) < new Date()) { await session.abortTransaction(); return res.status(400).json({ error: 'Nu poți anula o rezervare la un spectacol trecut.' }); }

    // Eliberează biletele PDF — le dezatribuie
    const idBilete = rezervare.participanti.map(p => p.bilet).filter(Boolean);
    await Bilet.updateMany(
      { _id: { $in: idBilete } },
      { atribuit: false, rezervare: null, participant: { nume: null, prenume: null }, dataAtribuire: null },
      { session }
    );

    // Adaugă biletele înapoi la disponibile
    await Spectacol.findByIdAndUpdate(
      rezervare.spectacol._id,
      { $inc: { nrBileteDisponibile: rezervare.nrBilete } },
      { session }
    );

    rezervare.status    = 'anulata';
    rezervare.dataAnulare = new Date();
    await rezervare.save({ session });

    await session.commitTransaction();

    trimiteAnulare(req.user.email, req.user.nume, req.user.prenume, rezervare, rezervare.spectacol).catch(console.error);

    res.json({ success: true, message: `Rezervare anulată. ${rezervare.nrBilete} bilet(e) eliberate.` });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    res.status(500).json({ error: 'Eroare la anulare.' });
  } finally {
    session.endSession();
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const Application = require('../models/Application');
const { STATUSES } = require('../models/Application');
const auth = require('../middleware/auth');

const router = express.Router();

// Every application route requires a signed-in user.
router.use(auth);

const EDITABLE = ['company', 'role', 'status', 'location', 'jobUrl', 'appliedOn', 'notes'];

function pickEditable(body) {
  const out = {};
  for (const key of EDITABLE) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

// GET /api/applications/stats — counts by status for the dashboard.
// Declared BEFORE /:id so "stats" is not treated as an application id.
router.get('/stats', async (req, res, next) => {
  try {
    // req.user.id is a string from the JWT; the aggregate $match needs an ObjectId.
    const rows = await Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    let total = 0;
    for (const row of rows) {
      byStatus[row._id] = row.count;
      total += row.count;
    }
    const inProgress = byStatus['Phone Screen'] + byStatus.Interview;
    const responseRate = total ? Math.round(((total - byStatus.Applied) / total) * 100) : 0;
    return res.json({ total, byStatus, inProgress, offers: byStatus.Offer, responseRate });
  } catch (err) {
    return next(err);
  }
});

// GET /api/applications — list my applications (optional ?status= & ?q=)
router.get('/', async (req, res, next) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.q) {
      const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ company: rx }, { role: rx }];
    }
    const applications = await Application.find(filter).sort({ appliedOn: -1, createdAt: -1 });
    return res.json({ count: applications.length, applications });
  } catch (err) {
    return next(err);
  }
});

// POST /api/applications — create
router.post('/', async (req, res, next) => {
  try {
    const data = pickEditable(req.body);
    if (!data.company || !data.role) {
      return res.status(400).json({ message: 'Company and role are required' });
    }
    const application = await Application.create({ ...data, user: req.user.id });
    return res.status(201).json({ application });
  } catch (err) {
    return next(err);
  }
});

// GET /api/applications/:id — one of mine
router.get('/:id', async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, user: req.user.id });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    return res.json({ application });
  } catch (err) {
    return next(err);
  }
});

// PUT /api/applications/:id — update (including moving it along the pipeline)
router.put('/:id', async (req, res, next) => {
  try {
    const data = pickEditable(req.body);
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      data,
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ message: 'Application not found' });
    return res.json({ application });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/applications/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    return res.json({ message: 'Application deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

const mongoose = require('mongoose');

const STATUSES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'];

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: [true, 'Company is required'], trim: true, maxlength: 120 },
    role: { type: String, required: [true, 'Role is required'], trim: true, maxlength: 120 },
    status: { type: String, enum: STATUSES, default: 'Applied', index: true },
    location: { type: String, trim: true, maxlength: 120, default: '' },
    jobUrl: { type: String, trim: true, maxlength: 500, default: '' },
    appliedOn: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

// Dashboard lists a user's applications newest-first most of the time.
applicationSchema.index({ user: 1, appliedOn: -1 });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STATUSES = STATUSES;

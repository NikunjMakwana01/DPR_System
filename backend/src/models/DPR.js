const mongoose = require('mongoose');

const dprSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    date: { type: Date, required: true },
    longApp: { type: Number, default: 0, min: 0 },
    shortApp: { type: Number, default: 0, min: 0 },
    availability: { type: Number, default: 0, min: 0 },
    screening: { type: Number, default: 0, min: 0 },
    assessment: { type: Number, default: 0, min: 0 },
    remarks: { type: String, default: '', trim: true },
    editedByAdmin: { type: Boolean, default: false },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dprSchema.index({ employee: 1, candidate: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DPR', dprSchema);

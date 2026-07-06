const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    jobRole: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'placed', 'on-hold'],
      default: 'active',
    },
    remarks: { type: String, default: '', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);

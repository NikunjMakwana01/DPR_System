const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'DPR Management System' },
    officeIP: { type: String, default: '' },
    workStartTime: { type: String, default: '07:00' },
    workEndTime: { type: String, default: '16:30' },
    lateMinutes: { type: Number, default: 10 },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

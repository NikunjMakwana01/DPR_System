const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String, default: '' },
    status: { type: String, enum: ['present', 'late', 'absent'], default: 'present' },
    workStatus: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    remarks: { type: String, default: '', trim: true },
    ipAddress: { type: String, default: '' },
    checkOutIpAddress: { type: String, default: '' },
    device: { type: String, default: '' },
    browser: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    checkOutTimestamp: { type: Date },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

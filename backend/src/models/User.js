const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'rejected'],
      default: 'pending',
    },
    profilePhoto: { type: String, default: '' },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getProfileCompletion = function () {
  const fields = ['fullName', 'employeeId', 'email', 'department', 'designation', 'mobileNumber', 'profilePhoto'];
  const filled = fields.filter((f) => this[f] && this[f].toString().trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
};

module.exports = mongoose.model('User', userSchema);

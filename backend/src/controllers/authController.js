const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const getClientIP = require('../utils/getClientIP');
const { getOnOfficeNetwork } = require('../utils/officeNetwork');
const { logActivity, createNotification } = require('../utils/helpers');

exports.register = async (req, res) => {
  const { fullName, employeeId, email, password, department, designation, mobileNumber } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { employeeId }] });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? 'Email already registered' : 'Employee ID already exists',
    });
  }

  const user = await User.create({
    fullName,
    employeeId,
    email,
    password,
    department,
    designation,
    mobileNumber,
    role: 'employee',
    status: 'pending',
  });

  const admins = await User.find({ role: 'admin', status: 'active' });
  for (const admin of admins) {
    await createNotification(
      admin._id,
      'New Employee Registration',
      `${fullName} (${employeeId}) has registered and is pending approval.`,
      'info',
      '/admin/employees?status=pending'
    );
  }

  await logActivity(user._id, 'REGISTER', `Employee ${employeeId} registered`, req);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please wait for admin approval.',
    data: {
      _id: user._id,
      fullName: user.fullName,
      employeeId: user.employeeId,
      email: user.email,
      status: user.status,
    },
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.role === 'employee' && user.status === 'pending') {
    return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({ success: false, message: 'Your registration has been rejected' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
  }

  user.lastLogin = new Date();
  await user.save();

  await logActivity(user._id, 'LOGIN', `User logged in from ${getClientIP(req)}`, req);

  const onOfficeNetwork = user.role === 'admin' ? true : await getOnOfficeNetwork(req);

  res.json({
    success: true,
    data: {
      _id: user._id,
      fullName: user.fullName,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department,
      designation: user.designation,
      profilePhoto: user.profilePhoto,
      onOfficeNetwork,
      token: generateToken(user),
    },
  });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  const onOfficeNetwork = user.role === 'admin' ? true : await getOnOfficeNetwork(req);

  res.json({
    success: true,
    data: {
      ...user.toObject(),
      profileCompletion: user.getProfileCompletion(),
      onOfficeNetwork,
    },
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    });
  }

  const admins = await User.find({ role: 'admin', status: 'active' });
  for (const admin of admins) {
    await createNotification(
      admin._id,
      'Password Reset Request',
      `${user.fullName} (${user.employeeId}) requested a password reset.`,
      'warning',
      `/admin/employees/${user._id}`
    );
  }

  res.json({
    success: true,
    message: 'If an account exists with this email, an admin has been notified to reset your password.',
  });
};

exports.logout = async (req, res) => {
  await logActivity(req.user._id, 'LOGOUT', 'User logged out', req);
  res.json({ success: true, message: 'Logged out successfully' });
};

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const DPR = require('../models/DPR');
const { Parser } = require('json2csv');
const { logActivity, createNotification } = require('../utils/helpers');
const { isConfigured, uploadProfilePhoto, deleteByUrl } = require('../config/cloudinary');

exports.getEmployees = async (req, res) => {
  const { search, status, department, page = 1, limit = 10 } = req.query;
  const query = { role: 'employee' };

  if (status) query.status = status;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [employees, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: employees,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
};

exports.getEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id).select('-password');
  if (!employee || employee.role !== 'employee') {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const [attendance, assignments, reports] = await Promise.all([
    Attendance.find({ employee: employee._id }).sort({ date: -1 }).limit(30),
    Assignment.find({ employee: employee._id, isActive: true }).populate('candidate'),
    DPR.find({ employee: employee._id }).populate('candidate').sort({ date: -1 }).limit(30),
  ]);

  res.json({
    success: true,
    data: {
      employee: { ...employee.toObject(), profileCompletion: employee.getProfileCompletion() },
      attendance,
      assignments,
      reports,
    },
  });
};

exports.createEmployee = async (req, res) => {
  const { fullName, employeeId, email, password, department, designation, mobileNumber } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { employeeId }] });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email or Employee ID already exists' });
  }

  const employee = await User.create({
    fullName,
    employeeId,
    email,
    password,
    department,
    designation,
    mobileNumber,
    role: 'employee',
    status: 'active',
  });

  await logActivity(req.user._id, 'CREATE_EMPLOYEE', `Created employee ${employeeId}`, req);

  res.status(201).json({ success: true, data: employee, message: 'Employee created successfully' });
};

exports.approveEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.role !== 'employee') {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  employee.status = 'active';
  await employee.save();

  await createNotification(employee._id, 'Account Approved', 'Your account has been approved. You can now login.', 'success');
  await logActivity(req.user._id, 'APPROVE_EMPLOYEE', `Approved ${employee.employeeId}`, req);

  res.json({ success: true, data: employee, message: 'Employee approved' });
};

exports.rejectEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.role !== 'employee') {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  employee.status = 'rejected';
  await employee.save();

  await createNotification(employee._id, 'Registration Rejected', 'Your registration has been rejected.', 'error');
  await logActivity(req.user._id, 'REJECT_EMPLOYEE', `Rejected ${employee.employeeId}`, req);

  res.json({ success: true, data: employee, message: 'Employee rejected' });
};

exports.deactivateEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.role !== 'employee') {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  employee.status = 'inactive';
  await employee.save();

  await createNotification(employee._id, 'Account Deactivated', 'Your account has been deactivated.', 'warning');
  await logActivity(req.user._id, 'DEACTIVATE_EMPLOYEE', `Deactivated ${employee.employeeId}`, req);

  res.json({ success: true, data: employee, message: 'Employee deactivated' });
};

exports.activateEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.role !== 'employee') {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  employee.status = 'active';
  await employee.save();

  await createNotification(employee._id, 'Account Activated', 'Your account has been activated.', 'success');
  await logActivity(req.user._id, 'ACTIVATE_EMPLOYEE', `Activated ${employee.employeeId}`, req);

  res.json({ success: true, data: employee, message: 'Employee activated' });
};

exports.deleteEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.role !== 'employee') {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  await User.findByIdAndDelete(req.params.id);
  await logActivity(req.user._id, 'DELETE_EMPLOYEE', `Deleted ${employee.employeeId}`, req);

  res.json({ success: true, message: 'Employee deleted' });
};

exports.resetPassword = async (req, res) => {
  const { password } = req.body;
  const employee = await User.findById(req.params.id);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  employee.password = password;
  await employee.save();

  await createNotification(employee._id, 'Password Reset', 'Your password has been reset by admin.', 'info');
  await logActivity(req.user._id, 'RESET_PASSWORD', `Reset password for ${employee.employeeId}`, req);

  res.json({ success: true, message: 'Password reset successfully' });
};

exports.updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { mobileNumber, password } = req.body;

  if (mobileNumber) user.mobileNumber = mobileNumber;
  if (password) user.password = password;

  if (req.file) {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Image upload is not configured. Set Cloudinary environment variables on the server.',
      });
    }

    const previousPhoto = user.profilePhoto;
    const result = await uploadProfilePhoto(req.file);
    user.profilePhoto = result.secure_url;
    await deleteByUrl(previousPhoto);
  }

  await user.save();

  res.json({
    success: true,
    data: {
      ...user.toObject(),
      password: undefined,
      profileCompletion: user.getProfileCompletion(),
    },
    message: 'Profile updated successfully',
  });
};

exports.exportEmployees = async (req, res) => {
  const employees = await User.find({ role: 'employee' }).select('-password').lean();
  const fields = ['employeeId', 'fullName', 'email', 'department', 'designation', 'mobileNumber', 'status', 'createdAt'];
  const parser = new Parser({ fields });
  const csv = parser.parse(employees);

  res.header('Content-Type', 'text/csv');
  res.attachment('employees.csv');
  res.send(csv);
};

const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { Parser } = require('json2csv');
const getClientIP = require('../utils/getClientIP');
const parseUserAgent = require('../utils/parseUserAgent');
const { logActivity, getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, getDPRCompletionStatus } = require('../utils/helpers');

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const determineStatus = async (checkInTime) => {
  const settings = (await Settings.findOne()) || { workStartTime: '07:00', lateMinutes: 10 };
  const startMinutes = timeToMinutes(settings.workStartTime);
  const checkMinutes = timeToMinutes(checkInTime);
  const graceEnd = startMinutes + (settings.lateMinutes || 10);

  if (checkMinutes <= graceEnd) return 'present';
  return 'late';
};

const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

const getElapsedDaysInMonth = (month, year) => {
  const now = new Date();
  const totalDays = getDaysInMonth(month, year);
  if (now.getFullYear() === year && now.getMonth() + 1 === month) {
    return now.getDate();
  }
  return totalDays;
};

exports.startWork = async (req, res) => {
  const today = getStartOfDay();
  const existing = await Attendance.findOne({ employee: req.user._id, date: today });

  if (existing) {
    return res.status(400).json({ success: false, message: 'You have already started work today' });
  }

  const now = new Date();
  const checkInTime = now.toTimeString().slice(0, 5);
  const { browser, device } = parseUserAgent(req.headers['user-agent']);
  const status = await determineStatus(checkInTime);

  const attendance = await Attendance.create({
    employee: req.user._id,
    date: today,
    checkInTime,
    status,
    workStatus: 'in_progress',
    remarks: req.body.remarks || '',
    ipAddress: getClientIP(req),
    device,
    browser,
    timestamp: now,
  });

  await logActivity(req.user._id, 'START_WORK', `Started work (${status}) at ${checkInTime}`, req);

  const dprStatus = await getDPRCompletionStatus(req.user._id, today);

  res.status(201).json({
    success: true,
    data: { attendance, dprStatus },
    message: 'Work started successfully',
  });
};

exports.endWork = async (req, res) => {
  const today = getStartOfDay();
  const attendance = await Attendance.findOne({ employee: req.user._id, date: today });

  if (!attendance) {
    return res.status(400).json({ success: false, message: 'You must start work before ending work' });
  }

  if (attendance.workStatus === 'completed') {
    return res.status(400).json({ success: false, message: 'You have already ended work today' });
  }

  const dprStatus = await getDPRCompletionStatus(req.user._id, today);

  if (!dprStatus.allSubmitted) {
    return res.status(400).json({
      success: false,
      message: `Submit DPR for all assigned candidates before ending work. ${dprStatus.pendingCandidates.length} pending.`,
      data: { pendingCandidates: dprStatus.pendingCandidates },
    });
  }

  const now = new Date();
  attendance.checkOutTime = now.toTimeString().slice(0, 5);
  attendance.checkOutTimestamp = now;
  attendance.checkOutIpAddress = getClientIP(req);
  attendance.workStatus = 'completed';
  if (req.body.remarks) attendance.remarks = req.body.remarks;
  await attendance.save();

  await logActivity(req.user._id, 'END_WORK', `Ended work at ${attendance.checkOutTime}`, req);

  res.json({
    success: true,
    data: { attendance, dprStatus },
    message: 'Work ended successfully',
  });
};

exports.markAttendance = exports.startWork;

exports.getMyAttendance = async (req, res) => {
  const { month, year } = req.query;
  const query = { employee: req.user._id };

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    query.date = { $gte: getStartOfMonth(start), $lte: getEndOfMonth(start) };
  }

  const attendance = await Attendance.find(query).sort({ date: -1 });
  res.json({ success: true, data: attendance });
};

exports.getTodayAttendance = async (req, res) => {
  const today = getStartOfDay();
  const attendance = await Attendance.findOne({ employee: req.user._id, date: today });
  const dprStatus = await getDPRCompletionStatus(req.user._id, today);

  res.json({ success: true, data: { attendance, dprStatus } });
};

exports.getAllAttendance = async (req, res) => {
  const { status, employee, month, year, page = 1, limit = 20 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (employee) query.employee = employee;

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    query.date = { $gte: getStartOfMonth(start), $lte: getEndOfMonth(start) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [attendance, total] = await Promise.all([
    Attendance.find(query)
      .populate('employee', 'fullName employeeId department')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Attendance.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: attendance,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
};

exports.getMonthlySummary = async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = getEndOfMonth(start);
  const totalDays = getDaysInMonth(month, year);
  const elapsedDays = getElapsedDaysInMonth(month, year);

  const employees = await User.find({ role: 'employee', status: 'active' }).select('fullName employeeId department');

  const summary = await Promise.all(
    employees.map(async (emp) => {
      const records = await Attendance.find({
        employee: emp._id,
        date: { $gte: getStartOfMonth(start), $lte: end },
        status: { $in: ['present', 'late'] },
      });

      const present = records.length;
      const absent = Math.max(0, elapsedDays - present);

      return {
        employee: emp,
        present,
        absent,
        totalDays,
        elapsedDays,
        summary: `${present}/${totalDays}`,
        absentSummary: `${absent}/${totalDays}`,
      };
    })
  );

  res.json({ success: true, data: summary, month, year, totalDays });
};

exports.exportAttendance = async (req, res) => {
  const { month, year } = req.query;
  const query = {};

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    query.date = { $gte: getStartOfMonth(start), $lte: getEndOfMonth(start) };
  }

  const records = await Attendance.find(query)
    .populate('employee', 'fullName employeeId department')
    .lean();

  const formatted = records.map((r) => ({
    employeeId: r.employee?.employeeId,
    fullName: r.employee?.fullName,
    department: r.employee?.department,
    date: new Date(r.date).toISOString().split('T')[0],
    checkInTime: r.checkInTime,
    checkOutTime: r.checkOutTime || '-',
    status: r.status,
    workStatus: r.workStatus,
    remarks: r.remarks,
    ipAddress: r.ipAddress,
    device: r.device,
    browser: r.browser,
  }));

  const fields = ['employeeId', 'fullName', 'department', 'date', 'checkInTime', 'checkOutTime', 'status', 'workStatus', 'remarks', 'ipAddress', 'device', 'browser'];
  const parser = new Parser({ fields });
  const csv = parser.parse(formatted);

  res.header('Content-Type', 'text/csv');
  res.attachment('attendance.csv');
  res.send(csv);
};

exports.getAttendanceStats = async (req, res) => {
  const today = getStartOfDay();
  const activeEmployees = await User.countDocuments({ role: 'employee', status: 'active' });
  const presentToday = await Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } });
  const absentToday = activeEmployees - presentToday;

  res.json({
    success: true,
    data: { activeEmployees, presentToday, absentToday: Math.max(0, absentToday) },
  });
};

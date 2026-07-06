const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const DPR = require('../models/DPR');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, getDPRCompletionStatus } = require('../utils/helpers');

exports.getAdminDashboard = async (req, res) => {
  const today = getStartOfDay();
  const monthStart = getStartOfMonth();
  const monthEnd = getEndOfMonth();

  const [
    totalEmployees,
    activeEmployees,
    pendingEmployees,
    presentToday,
    totalCandidates,
    todayReports,
    monthlyReports,
    recentActivities,
    recentLogins,
    notifications,
  ] = await Promise.all([
    User.countDocuments({ role: 'employee' }),
    User.countDocuments({ role: 'employee', status: 'active' }),
    User.countDocuments({ role: 'employee', status: 'pending' }),
    Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } }),
    Candidate.countDocuments(),
    DPR.countDocuments({ date: { $gte: today, $lte: getEndOfDay() } }),
    DPR.countDocuments({ date: { $gte: monthStart, $lte: monthEnd } }),
    Activity.find().populate('user', 'fullName employeeId role').sort({ createdAt: -1 }).limit(10),
    User.find({ lastLogin: { $exists: true } }).select('fullName employeeId lastLogin role').sort({ lastLogin: -1 }).limit(5),
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10),
  ]);

  const absentToday = Math.max(0, activeEmployees - presentToday);

  const attendanceGraph = await getAttendanceGraphData();
  const reportGraph = await getReportGraphData();
  const performanceGraph = await getPerformanceData();
  const candidateGraph = await getCandidateApplicationData();

  res.json({
    success: true,
    data: {
      cards: {
        totalEmployees,
        activeEmployees,
        pendingEmployees,
        presentToday,
        absentToday,
        totalCandidates,
        todayReports,
        monthlyReports,
      },
      charts: {
        attendance: attendanceGraph,
        reports: reportGraph,
        performance: performanceGraph,
        candidates: candidateGraph,
      },
      recentActivities,
      recentLogins,
      notifications,
    },
  });
};

exports.getEmployeeDashboard = async (req, res) => {
  const today = getStartOfDay();
  const monthStart = getStartOfMonth();
  const monthEnd = getEndOfMonth();
  const user = await User.findById(req.user._id);

  const [todayAttendance, assignedCandidates, monthlyReports, notifications] = await Promise.all([
    Attendance.findOne({ employee: req.user._id, date: today }),
    Assignment.countDocuments({ employee: req.user._id, isActive: true }),
    DPR.countDocuments({ employee: req.user._id, date: { $gte: monthStart, $lte: monthEnd } }),
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
  ]);

  const dprStatus = await getDPRCompletionStatus(req.user._id, today);

  res.json({
    success: true,
    data: {
      todayAttendance,
      assignedCandidates,
      todayReports: dprStatus.totalSubmitted,
      monthlyReports,
      profileCompletion: user.getProfileCompletion(),
      notifications,
      dprStatus,
      user: {
        fullName: user.fullName,
        employeeId: user.employeeId,
        department: user.department,
        designation: user.designation,
        profilePhoto: user.profilePhoto,
      },
    },
  });
};

async function getAttendanceGraphData() {
  const days = 7;
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const start = getStartOfDay(date);
    const end = getEndOfDay(date);
    const [present, late] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: 'present' }),
      Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: 'late' }),
    ]);
    data.push({
      date: start.toISOString().split('T')[0],
      present,
      late,
      total: present + late,
    });
  }
  return data;
}

async function getReportGraphData() {
  const days = 7;
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const start = getStartOfDay(date);
    const end = getEndOfDay(date);
    const count = await DPR.countDocuments({ date: { $gte: start, $lte: end } });
    data.push({ date: start.toISOString().split('T')[0], reports: count });
  }
  return data;
}

async function getPerformanceData() {
  const employees = await User.find({ role: 'employee', status: 'active' }).select('fullName employeeId');
  const monthStart = getStartOfMonth();
  const monthEnd = getEndOfMonth();

  const data = await Promise.all(
    employees.slice(0, 10).map(async (emp) => {
      const reports = await DPR.find({ employee: emp._id, date: { $gte: monthStart, $lte: monthEnd } });
      const total = reports.reduce(
        (acc, r) =>
          acc +
          (r.longApp ?? r.applicationsSubmitted ?? 0) +
          (r.shortApp ?? r.rejected ?? 0) +
          (r.availability ?? r.offers ?? 0) +
          (r.screening ?? r.joined ?? 0) +
          (r.assessment ?? r.interviewsScheduled ?? 0),
        0
      );
      return { name: emp.fullName.split(' ')[0], employeeId: emp.employeeId, score: total };
    })
  );

  return data.sort((a, b) => b.score - a.score);
}

async function getCandidateApplicationData() {
  const monthStart = getStartOfMonth();
  const monthEnd = getEndOfMonth();
  const reports = await DPR.find({ date: { $gte: monthStart, $lte: monthEnd } }).populate('candidate', 'name');

  const candidateMap = {};
  reports.forEach((r) => {
    const name = r.candidate?.name || 'Unknown';
    if (!candidateMap[name]) candidateMap[name] = 0;
    candidateMap[name] += r.longApp ?? r.applicationsSubmitted ?? 0;
  });

  return Object.entries(candidateMap)
    .map(([name, applications]) => ({ name, applications }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 10);
}

const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const Assignment = require('../models/Assignment');
const DPR = require('../models/DPR');
const getClientIP = require('../utils/getClientIP');

const logActivity = async (userId, action, details, req) => {
  try {
    await Activity.create({
      user: userId,
      action,
      details,
      ipAddress: req ? getClientIP(req) : '',
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

const createNotification = async (userId, title, message, type = 'info', link = '') => {
  try {
    await Notification.create({ user: userId, title, message, type, link });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getStartOfMonth = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfMonth = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildPeriodDateFilter = (period) => {
  const normalized = period === 'today' ? 'daily' : period;

  if (!normalized || normalized === 'all') {
    return null;
  }

  if (normalized === 'daily') {
    return { $gte: getStartOfDay(), $lte: getEndOfDay() };
  }

  if (normalized === 'weekly') {
    return { $gte: getStartOfWeek(), $lte: getEndOfDay() };
  }

  if (normalized === 'monthly') {
    return { $gte: getStartOfMonth(), $lte: getEndOfMonth() };
  }

  return null;
};

const getDPRCompletionStatus = async (employeeId, today) => {
  const assignments = await Assignment.find({ employee: employeeId, isActive: true }).populate(
    'candidate',
    'name jobRole'
  );

  const assignedIds = assignments
    .map((a) => a.candidate?._id?.toString())
    .filter(Boolean);

  const todayDPRs = await DPR.find({
    employee: employeeId,
    date: { $gte: getStartOfDay(today), $lte: getEndOfDay(today) },
  }).populate('candidate', 'name jobRole');

  const submittedForAssigned = todayDPRs.filter((d) => {
    const candId = d.candidate?._id?.toString();
    return candId && assignedIds.includes(candId);
  });

  const submittedIds = submittedForAssigned.map((d) => d.candidate._id.toString());

  const pending = assignments
    .filter((a) => a.candidate && !submittedIds.includes(a.candidate._id.toString()))
    .map((a) => ({ _id: a.candidate._id, name: a.candidate.name, jobRole: a.candidate.jobRole }));

  return {
    totalAssigned: assignedIds.length,
    totalSubmitted: submittedForAssigned.length,
    allSubmitted: assignedIds.length === 0 || pending.length === 0,
    pendingCandidates: pending,
    submittedReports: submittedForAssigned,
    assignedCandidates: assignments.map((a) => a.candidate).filter(Boolean),
  };
};

module.exports = {
  logActivity,
  createNotification,
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfWeek,
  buildPeriodDateFilter,
  getDPRCompletionStatus,
};

const DPR = require('../models/DPR');
const Assignment = require('../models/Assignment');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { logActivity, getStartOfDay, getEndOfDay, buildPeriodDateFilter } = require('../utils/helpers');
const { normalizeDPR, pickDPRPayload, emptyTotals, addToTotals, DPR_TOTAL_KEYS } = require('../utils/dprFields');

exports.submitDPR = async (req, res) => {
  const today = getStartOfDay();
  const { candidate } = req.body;

  const assignment = await Assignment.findOne({
    employee: req.user._id,
    candidate,
    isActive: true,
  });

  if (!assignment) {
    return res.status(403).json({ success: false, message: 'This candidate is not assigned to you' });
  }

  const existing = await DPR.findOne({ employee: req.user._id, candidate, date: today });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Report already submitted for this candidate today' });
  }

  const report = await DPR.create({
    employee: req.user._id,
    candidate,
    date: today,
    ...pickDPRPayload(req.body),
  });

  await logActivity(req.user._id, 'SUBMIT_DPR', `Submitted DPR for candidate ${candidate}`, req);

  const populated = await DPR.findById(report._id).populate('candidate', 'name jobRole');
  res.status(201).json({ success: true, data: normalizeDPR(populated), message: 'DPR submitted successfully' });
};

exports.updateDPR = async (req, res) => {
  const report = await DPR.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = report.employee.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (!isAdmin) {
    const today = getStartOfDay();
    if (report.date.getTime() !== today.getTime()) {
      return res.status(400).json({ success: false, message: 'You can only edit today\'s reports' });
    }
  }

  Object.assign(report, pickDPRPayload(req.body));
  if (isAdmin) {
    report.editedByAdmin = true;
    report.lastEditedBy = req.user._id;
  }

  await report.save();
  const populated = await DPR.findById(report._id).populate('candidate', 'name jobRole').populate('employee', 'fullName employeeId');

  res.json({ success: true, data: normalizeDPR(populated), message: 'Report updated' });
};

exports.getMyReports = async (req, res) => {
  const { period = 'daily' } = req.query;
  const query = { employee: req.user._id };

  const dateFilter = buildPeriodDateFilter(period);
  if (dateFilter) {
    query.date = dateFilter;
  }

  const reports = await DPR.find(query).populate('candidate', 'name jobRole').sort({ date: -1 });
  res.json({
    success: true,
    data: reports.map(normalizeDPR),
    period: period === 'today' ? 'daily' : period,
  });
};

exports.getAllReports = async (req, res) => {
  const { search, employee, candidate, startDate, endDate, page = 1, limit = 20, grouped, period } = req.query;

  if (grouped === 'true') {
    return exports.getGroupedReports(req, res);
  }

  const query = {};
  if (employee) query.employee = employee;
  if (candidate) query.candidate = candidate;

  const periodFilter = buildPeriodDateFilter(period);
  if (periodFilter) {
    query.date = periodFilter;
  } else if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = getStartOfDay(new Date(startDate));
    if (endDate) query.date.$lte = getEndOfDay(new Date(endDate));
  }

  const skip = (Number(page) - 1) * Number(limit);
  let reports = await DPR.find(query)
    .populate('employee', 'fullName employeeId department')
    .populate('candidate', 'name jobRole')
    .sort({ date: -1 })
    .skip(skip)
    .limit(Number(limit));

  if (search) {
    const searchLower = search.toLowerCase();
    reports = reports.filter(
      (r) =>
        r.employee?.fullName?.toLowerCase().includes(searchLower) ||
        r.candidate?.name?.toLowerCase().includes(searchLower)
    );
  }

  const total = await DPR.countDocuments(query);

  res.json({
    success: true,
    data: reports.map(normalizeDPR),
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
};

exports.exportReportsCSV = async (req, res) => {
  const query = {};
  const periodFilter = buildPeriodDateFilter(req.query.period);
  if (periodFilter) query.date = periodFilter;

  const reports = await DPR.find(query)
    .populate('employee', 'fullName employeeId department')
    .populate('candidate', 'name jobRole')
    .lean();

  const formatted = reports.map((r) => {
    const n = normalizeDPR(r);
    return {
      date: new Date(n.date).toISOString().split('T')[0],
      employeeId: n.employee?.employeeId,
      employeeName: n.employee?.fullName,
      department: n.employee?.department,
      candidate: n.candidate?.name,
      jobRole: n.candidate?.jobRole,
      longApp: n.longApp,
      shortApp: n.shortApp,
      availability: n.availability,
      screening: n.screening,
      assessment: n.assessment,
      remarks: n.remarks,
    };
  });

  const fields = ['date', 'employeeId', 'employeeName', 'department', 'candidate', 'jobRole', 'longApp', 'shortApp', 'availability', 'screening', 'assessment', 'remarks'];
  const parser = new Parser({ fields });
  const csv = parser.parse(formatted);

  res.header('Content-Type', 'text/csv');
  res.attachment('dpr_reports.csv');
  res.send(csv);
};

exports.exportReportsPDF = async (req, res) => {
  const query = {};
  const periodFilter = buildPeriodDateFilter(req.query.period);
  if (periodFilter) query.date = periodFilter;

  const reports = await DPR.find(query)
    .populate('employee', 'fullName employeeId')
    .populate('candidate', 'name jobRole')
    .sort({ date: -1 })
    .limit(100);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=dpr_reports.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('Daily Progress Reports', { align: 'center' });
  doc.moveDown();

  reports.forEach((r, i) => {
    const n = normalizeDPR(r);
    if (i > 0) doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date(n.date).toLocaleDateString()}`);
    doc.text(`Employee: ${n.employee?.fullName} (${n.employee?.employeeId})`);
    doc.text(`Candidate: ${n.candidate?.name} - ${n.candidate?.jobRole}`);
    doc.text(`Long App: ${n.longApp} | Short App: ${n.shortApp} | Availability: ${n.availability} | Screening: ${n.screening} | Assessment: ${n.assessment}`);
    if (n.remarks) doc.text(`Remarks: ${n.remarks}`);
    doc.moveDown(0.5);
  });

  doc.end();
};

exports.getGroupedReports = async (req, res) => {
  const { search, startDate, endDate, page = 1, limit = 15, period = 'daily' } = req.query;
  const query = {};

  const periodFilter = buildPeriodDateFilter(period);
  if (periodFilter) {
    query.date = periodFilter;
  } else if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = getStartOfDay(new Date(startDate));
    if (endDate) query.date.$lte = getEndOfDay(new Date(endDate));
  }

  const reports = await DPR.find(query)
    .populate('employee', 'fullName employeeId department')
    .populate('candidate', 'name jobRole')
    .sort({ date: -1 });

  const groupMap = {};
  const normalizedPeriod = period === 'today' ? 'daily' : period;

  reports.forEach((r) => {
    const normalized = normalizeDPR(r);
    const dateKey = new Date(normalized.date).toISOString().split('T')[0];
    const empId = normalized.employee?._id?.toString();
    if (!empId) return;

    const key = normalizedPeriod === 'daily' ? `${empId}_${dateKey}` : empId;

    if (!groupMap[key]) {
      groupMap[key] = {
        date: normalized.date,
        employee: normalized.employee,
        candidates: [],
        totals: emptyTotals(),
      };
    }

    groupMap[key].candidates.push({
      _id: normalized._id,
      date: normalized.date,
      candidate: normalized.candidate,
      longApp: normalized.longApp,
      shortApp: normalized.shortApp,
      availability: normalized.availability,
      screening: normalized.screening,
      assessment: normalized.assessment,
      remarks: normalized.remarks,
    });

    addToTotals(groupMap[key].totals, normalized);
  });

  let grouped = Object.values(groupMap);

  if (search) {
    const searchLower = search.toLowerCase();
    grouped = grouped.filter(
      (g) =>
        g.employee?.fullName?.toLowerCase().includes(searchLower) ||
        g.employee?.employeeId?.toLowerCase().includes(searchLower) ||
        g.candidates.some((c) => c.candidate?.name?.toLowerCase().includes(searchLower))
    );
  }

  const total = grouped.length;
  const skip = (Number(page) - 1) * Number(limit);
  const paginated = grouped.slice(skip, skip + Number(limit));

  res.json({
    success: true,
    data: paginated,
    period: period === 'today' ? 'daily' : period,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
};

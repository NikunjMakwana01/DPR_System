const Assignment = require('../models/Assignment');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { logActivity, createNotification } = require('../utils/helpers');

exports.getAssignments = async (req, res) => {
  const { employee, candidate, page = 1, limit = 20 } = req.query;
  const query = { isActive: true };

  if (employee) query.employee = employee;
  if (candidate) query.candidate = candidate;

  const skip = (Number(page) - 1) * Number(limit);
  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .populate('candidate', 'name jobRole status')
      .populate('employee', 'fullName employeeId department')
      .populate('assignedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Assignment.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: assignments,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
};

exports.assignCandidates = async (req, res) => {
  const { employeeIds, candidateIds } = req.body;

  if (!employeeIds?.length || !candidateIds?.length) {
    return res.status(400).json({ success: false, message: 'Employee and candidate IDs are required' });
  }

  const created = [];
  for (const employeeId of employeeIds) {
    for (const candidateId of candidateIds) {
      const existing = await Assignment.findOne({ employee: employeeId, candidate: candidateId });
      if (existing) {
        if (!existing.isActive) {
          existing.isActive = true;
          existing.assignedBy = req.user._id;
          await existing.save();
          created.push(existing);
        }
        continue;
      }

      const assignment = await Assignment.create({
        employee: employeeId,
        candidate: candidateId,
        assignedBy: req.user._id,
      });
      created.push(assignment);

      const candidate = await Candidate.findById(candidateId);
      await createNotification(
        employeeId,
        'New Candidate Assigned',
        `You have been assigned candidate: ${candidate?.name || 'Unknown'}`,
        'info',
        '/employee/candidates'
      );
    }
  }

  await logActivity(req.user._id, 'ASSIGN_CANDIDATES', `Assigned ${created.length} assignments`, req);
  res.status(201).json({ success: true, data: created, message: 'Assignments created successfully' });
};

exports.removeAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('candidate', 'name');
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  assignment.isActive = false;
  await assignment.save();

  await createNotification(
    assignment.employee,
    'Candidate Unassigned',
    `Candidate ${assignment.candidate?.name || 'Unknown'} has been removed from your assignments.`,
    'warning',
    '/employee/candidates'
  );

  await logActivity(req.user._id, 'REMOVE_ASSIGNMENT', `Removed assignment ${assignment._id}`, req);
  res.json({ success: true, message: 'Assignment removed' });
};

exports.syncEmployeeAssignments = async (req, res) => {
  const { employeeId, candidateIds = [] } = req.body;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: 'Employee ID is required' });
  }

  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== 'employee') {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const newIds = candidateIds.map((id) => id.toString());
  const currentAssignments = await Assignment.find({ employee: employeeId, isActive: true }).populate('candidate', 'name');
  const currentIds = currentAssignments.map((a) => a.candidate._id.toString());

  const added = [];
  const removed = [];

  for (const assignment of currentAssignments) {
    const candId = assignment.candidate._id.toString();
    if (!newIds.includes(candId)) {
      assignment.isActive = false;
      await assignment.save();
      removed.push(assignment);

      await createNotification(
        employeeId,
        'Candidate Unassigned',
        `Candidate ${assignment.candidate.name} has been removed from your assignments.`,
        'warning',
        '/employee/candidates'
      );
    }
  }

  for (const candidateId of newIds) {
    if (currentIds.includes(candidateId)) continue;

    const existing = await Assignment.findOne({ employee: employeeId, candidate: candidateId });
    const candidate = await Candidate.findById(candidateId);

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.assignedBy = req.user._id;
        await existing.save();
        added.push(existing);
      }
    } else {
      const assignment = await Assignment.create({
        employee: employeeId,
        candidate: candidateId,
        assignedBy: req.user._id,
      });
      added.push(assignment);
    }

    if (candidate) {
      await createNotification(
        employeeId,
        'New Candidate Assigned',
        `You have been assigned candidate: ${candidate.name}`,
        'info',
        '/employee/candidates'
      );
    }
  }

  await logActivity(
    req.user._id,
    'SYNC_ASSIGNMENTS',
    `Synced assignments for ${employee.employeeId}: +${added.length} -${removed.length}`,
    req
  );

  const updated = await Assignment.find({ employee: employeeId, isActive: true }).populate('candidate', 'name jobRole');

  res.json({
    success: true,
    data: { added: added.length, removed: removed.length, assignments: updated },
    message: 'Assignments updated successfully',
  });
};

exports.reassignCandidate = async (req, res) => {
  const { fromEmployeeId, toEmployeeId, candidateId } = req.body;

  await Assignment.findOneAndUpdate(
    { employee: fromEmployeeId, candidate: candidateId, isActive: true },
    { isActive: false }
  );

  const assignment = await Assignment.findOneAndUpdate(
    { employee: toEmployeeId, candidate: candidateId },
    { isActive: true, assignedBy: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const candidate = await Candidate.findById(candidateId);
  await createNotification(
    toEmployeeId,
    'Candidate Reassigned',
    `Candidate ${candidate?.name} has been reassigned to you.`,
    'info'
  );

  await logActivity(req.user._id, 'REASSIGN_CANDIDATE', `Reassigned candidate ${candidateId}`, req);
  res.json({ success: true, data: assignment, message: 'Candidate reassigned' });
};

exports.getMyAssignments = async (req, res) => {
  const assignments = await Assignment.find({ employee: req.user._id, isActive: true })
    .populate('candidate')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: assignments });
};

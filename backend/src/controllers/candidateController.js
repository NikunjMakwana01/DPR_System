const Candidate = require('../models/Candidate');
const Assignment = require('../models/Assignment');
const { logActivity } = require('../utils/helpers');

exports.getCandidates = async (req, res) => {
  const { search, status, page = 1, limit = 10 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { jobRole: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [candidates, total] = await Promise.all([
    Candidate.find(query).populate('createdBy', 'fullName').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Candidate.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: candidates,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
};

exports.getMyCandidates = async (req, res) => {
  const assignments = await Assignment.find({ employee: req.user._id, isActive: true }).populate('candidate');
  const candidates = assignments.map((a) => a.candidate).filter(Boolean);

  res.json({ success: true, data: candidates });
};

exports.createCandidate = async (req, res, next) => {
  try {
    const { name, jobRole, status, remarks } = req.body;
    const candidate = await Candidate.create({ name, jobRole, status, remarks, createdBy: req.user._id });
    await logActivity(req.user._id, 'CREATE_CANDIDATE', `Created candidate ${candidate.name}`, req);
    res.status(201).json({ success: true, data: candidate, message: 'Candidate created' });
  } catch (err) {
    next(err);
  }
};

exports.updateCandidate = async (req, res, next) => {
  try {
    const { name, jobRole, status, remarks } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { name, jobRole, status, remarks },
      { new: true, runValidators: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    await logActivity(req.user._id, 'UPDATE_CANDIDATE', `Updated candidate ${candidate.name}`, req);
    res.json({ success: true, data: candidate, message: 'Candidate updated' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCandidate = async (req, res) => {
  const candidate = await Candidate.findByIdAndDelete(req.params.id);
  if (!candidate) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }
  await Assignment.deleteMany({ candidate: req.params.id });
  await logActivity(req.user._id, 'DELETE_CANDIDATE', `Deleted candidate ${candidate.name}`, req);
  res.json({ success: true, message: 'Candidate deleted' });
};

exports.getCandidate = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('createdBy', 'fullName');
  if (!candidate) {
    return res.status(404).json({ success: false, message: 'Candidate not found' });
  }

  const assignments = await Assignment.find({ candidate: candidate._id, isActive: true }).populate('employee', 'fullName employeeId department');

  res.json({ success: true, data: { candidate, assignments } });
};

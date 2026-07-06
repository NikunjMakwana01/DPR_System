const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(protect);

router.get('/my', authorize('employee'), assignmentController.getMyAssignments);
router.get('/', authorize('admin'), assignmentController.getAssignments);
router.post('/', authorize('admin'), assignmentController.assignCandidates);
router.put('/sync', authorize('admin'), assignmentController.syncEmployeeAssignments);
router.put('/reassign', authorize('admin'), assignmentController.reassignCandidate);
router.delete('/:id', authorize('admin'), assignmentController.removeAssignment);

module.exports = router;

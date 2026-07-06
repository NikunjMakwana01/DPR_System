const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { candidateValidator } = require('../validators/candidateValidator');

router.use(protect);

router.get('/my', authorize('employee'), candidateController.getMyCandidates);
router.get('/', authorize('admin'), candidateController.getCandidates);
router.get('/:id', authorize('admin'), candidateController.getCandidate);
router.post('/', authorize('admin'), candidateValidator, validate, candidateController.createCandidate);
router.put('/:id', authorize('admin'), candidateValidator, validate, candidateController.updateCandidate);
router.delete('/:id', authorize('admin'), candidateController.deleteCandidate);

module.exports = router;

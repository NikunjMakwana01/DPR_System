const express = require('express');
const router = express.Router();
const dprController = require('../controllers/dprController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { dprValidator } = require('../validators/reportValidator');

router.use(protect);

router.post('/', authorize('employee'), dprValidator, validate, dprController.submitDPR);
router.get('/my', authorize('employee'), dprController.getMyReports);
router.get('/export/csv', authorize('admin'), dprController.exportReportsCSV);
router.get('/export/pdf', authorize('admin'), dprController.exportReportsPDF);
router.get('/', authorize('admin'), dprController.getAllReports);
router.put('/:id', dprController.updateDPR);

module.exports = router;

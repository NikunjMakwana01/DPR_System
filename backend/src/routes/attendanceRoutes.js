const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { attendanceValidator } = require('../validators/reportValidator');

router.use(protect);

router.post('/start', authorize('employee'), attendanceValidator, validate, attendanceController.startWork);
router.post('/end', authorize('employee'), attendanceValidator, validate, attendanceController.endWork);
router.post('/', authorize('employee'), attendanceValidator, validate, attendanceController.startWork);
router.get('/my', authorize('employee'), attendanceController.getMyAttendance);
router.get('/today', authorize('employee'), attendanceController.getTodayAttendance);
router.get('/monthly-summary', authorize('admin'), attendanceController.getMonthlySummary);
router.get('/stats', authorize('admin'), attendanceController.getAttendanceStats);
router.get('/export', authorize('admin'), attendanceController.exportAttendance);
router.get('/', authorize('admin'), attendanceController.getAllAttendance);

module.exports = router;

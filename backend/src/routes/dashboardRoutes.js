const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(protect);

router.get('/admin', authorize('admin'), dashboardController.getAdminDashboard);
router.get('/employee', authorize('employee'), dashboardController.getEmployeeDashboard);

module.exports = router;

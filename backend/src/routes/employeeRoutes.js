const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { createEmployeeValidator } = require('../validators/employeeValidator');

router.use(protect);

router.get('/', authorize('admin'), employeeController.getEmployees);
router.get('/export', authorize('admin'), employeeController.exportEmployees);
router.get('/:id', authorize('admin'), employeeController.getEmployee);
router.post('/', authorize('admin'), createEmployeeValidator, validate, employeeController.createEmployee);
router.put('/:id/approve', authorize('admin'), employeeController.approveEmployee);
router.put('/:id/reject', authorize('admin'), employeeController.rejectEmployee);
router.put('/:id/deactivate', authorize('admin'), employeeController.deactivateEmployee);
router.put('/:id/activate', authorize('admin'), employeeController.activateEmployee);
router.put('/:id/reset-password', authorize('admin'), employeeController.resetPassword);
router.delete('/:id', authorize('admin'), employeeController.deleteEmployee);

module.exports = router;

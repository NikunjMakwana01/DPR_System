const express = require('express');
const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const candidateRoutes = require('./candidateRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const dprRoutes = require('./dprRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const settingsRoutes = require('./settingsRoutes');
const notificationRoutes = require('./notificationRoutes');
const employeeController = require('../controllers/employeeController');
const protect = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { updateProfileValidator } = require('../validators/employeeValidator');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/candidates', candidateRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/dpr', dprRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);

router.put('/profile', protect, upload.single('profilePhoto'), updateProfileValidator, validate, employeeController.updateProfile);

module.exports = router;

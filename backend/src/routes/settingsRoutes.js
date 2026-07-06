const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

router.get('/client-ip', settingsController.getClientIP);
router.get('/', settingsController.getSettings);
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

module.exports = router;

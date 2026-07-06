const Settings = require('../models/Settings');
const { logActivity } = require('../utils/helpers');
const { refreshOfficeIPs, normalizeIP, validateOfficeIPValue } = require('../utils/officeIPCache');
const getClientIP = require('../utils/getClientIP');

exports.getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      companyName: 'DPR Management System',
      officeIP: '',
      workStartTime: '07:00',
      workEndTime: '16:30',
      lateMinutes: 10,
      theme: 'light',
    });
    await refreshOfficeIPs(settings.officeIP);
  }

  res.json({ success: true, data: settings });
};

exports.getClientIP = (req, res) => {
  const clientIP = normalizeIP(getClientIP(req));
  res.json({
    success: true,
    data: {
      clientIP,
      message: 'Use this IP as the Office WiFi IP in Settings to allow access from your current network.',
    },
  });
};

exports.updateSettings = async (req, res) => {
  if (req.body.officeIP !== undefined) {
    const validation = validateOfficeIPValue(req.body.officeIP);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }
  }

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }

  if (req.body.officeIP !== undefined) {
    await refreshOfficeIPs(settings.officeIP);
  }

  await logActivity(req.user._id, 'UPDATE_SETTINGS', 'System settings updated', req);
  res.json({ success: true, data: settings, message: 'Settings updated' });
};

const jwt = require('jsonwebtoken');
const getClientIP = require('./getClientIP');
const { getOfficeIPs, isIPAllowed } = require('./officeIPCache');

const OFFICE_NETWORK_MESSAGE = 'This application can only be accessed from the office network.';

const getUserRoleFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    return decoded.role || null;
  } catch {
    return null;
  }
};

const getOnOfficeNetwork = async (req) => {
  const allowedIPs = await getOfficeIPs();
  const clientIP = getClientIP(req);
  return isIPAllowed(clientIP, allowedIPs);
};

module.exports = {
  OFFICE_NETWORK_MESSAGE,
  getUserRoleFromRequest,
  getOnOfficeNetwork,
};

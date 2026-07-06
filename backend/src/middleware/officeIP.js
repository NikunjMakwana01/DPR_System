const getClientIP = require('../utils/getClientIP');
const { getOfficeIPs, isIPAllowed } = require('../utils/officeIPCache');
const {
  OFFICE_NETWORK_MESSAGE,
  getUserRoleFromRequest,
} = require('../utils/officeNetwork');

const AUTH_ROUTE_PREFIX = '/auth/';
const SETUP_ROUTE_PREFIXES = ['/settings'];

const isSetupRoute = (path) => SETUP_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));

const officeIPMiddleware = async (req, res, next) => {
  try {
    if (req.path.startsWith(AUTH_ROUTE_PREFIX)) {
      return next();
    }

    const role = getUserRoleFromRequest(req);
    if (role === 'admin') {
      return next();
    }

    const allowedIPs = await getOfficeIPs();
    const clientIP = getClientIP(req);

    if (isIPAllowed(clientIP, allowedIPs)) {
      return next();
    }

    if (!allowedIPs.length && isSetupRoute(req.path)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'OFFICE_NETWORK_REQUIRED',
      message: OFFICE_NETWORK_MESSAGE,
      clientIP,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = officeIPMiddleware;

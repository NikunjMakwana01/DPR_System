const Settings = require('../models/Settings');

let cachedOfficeIPs = [];
let cacheLoaded = false;

const normalizeIP = (ip) => {
  if (!ip) return '';
  return ip.trim().replace('::ffff:', '');
};

const parseOfficeIPs = (officeIPValue) => {
  if (!officeIPValue || !officeIPValue.trim()) return [];

  return officeIPValue
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
};

const ipToLong = (ip) => {
  const parts = normalizeIP(ip).split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255 || Number.isNaN(part))) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
};

const isIPInCIDR = (clientIP, cidr) => {
  const [network, prefixStr] = cidr.split('/');
  const prefix = Number(prefixStr);
  if (!prefixStr || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  const clientLong = ipToLong(clientIP);
  const networkLong = ipToLong(network);
  if (clientLong === null || networkLong === null) return false;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (clientLong & mask) === (networkLong & mask);
};

const matchesAllowedEntry = (clientIP, entry) => {
  const normalizedClient = normalizeIP(clientIP);
  const trimmedEntry = entry.trim();

  if (trimmedEntry.includes('/')) {
    return isIPInCIDR(normalizedClient, trimmedEntry);
  }

  return normalizeIP(trimmedEntry) === normalizedClient;
};

const isLocalhost = (clientIP) => {
  const normalized = normalizeIP(clientIP);
  return ['127.0.0.1', '::1', 'localhost'].includes(normalized);
};

const loadOfficeIPs = async () => {
  try {
    const settings = await Settings.findOne().select('officeIP');
    cachedOfficeIPs = parseOfficeIPs(settings?.officeIP || '');
    cacheLoaded = true;
  } catch (err) {
    console.error('Failed to load office IP settings:', err.message);
    cachedOfficeIPs = [];
    cacheLoaded = true;
  }
  return cachedOfficeIPs;
};

const refreshOfficeIPs = async (officeIPValue) => {
  if (officeIPValue !== undefined) {
    cachedOfficeIPs = parseOfficeIPs(officeIPValue);
    cacheLoaded = true;
    return cachedOfficeIPs;
  }
  return loadOfficeIPs();
};

const getOfficeIPs = async () => {
  if (!cacheLoaded) {
    await loadOfficeIPs();
  }
  return cachedOfficeIPs;
};

const isIPAllowed = (clientIP, allowedIPs) => {
  if (process.env.NODE_ENV === 'development' && isLocalhost(clientIP)) {
    return true;
  }

  if (!allowedIPs.length) {
    return false;
  }

  return allowedIPs.some((entry) => matchesAllowedEntry(clientIP, entry));
};

const isValidOfficeIPEntry = (entry) => {
  const trimmed = entry.trim();
  if (!trimmed) return false;

  if (trimmed.includes('/')) {
    const [network, prefixStr] = trimmed.split('/');
    const prefix = Number(prefixStr);
    if (!prefixStr || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    return ipToLong(network) !== null;
  }

  return ipToLong(trimmed) !== null;
};

const validateOfficeIPValue = (officeIPValue) => {
  if (!officeIPValue || !officeIPValue.trim()) {
    return { valid: false, message: 'Office IP address is required.' };
  }

  const entries = parseOfficeIPs(officeIPValue);
  if (!entries.length) {
    return { valid: false, message: 'Office IP address is required.' };
  }

  const invalid = entries.find((entry) => !isValidOfficeIPEntry(entry));
  if (invalid) {
    return {
      valid: false,
      message: `Invalid office IP entry: "${invalid}". Use an IPv4 address or subnet (e.g. 103.45.67.89 or 192.168.1.0/24).`,
    };
  }

  return { valid: true };
};

module.exports = {
  normalizeIP,
  parseOfficeIPs,
  loadOfficeIPs,
  refreshOfficeIPs,
  getOfficeIPs,
  isIPAllowed,
  validateOfficeIPValue,
};

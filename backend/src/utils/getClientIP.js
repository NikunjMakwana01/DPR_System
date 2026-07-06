const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    return ips[0];
  }
  return req.ip?.replace('::ffff:', '') || req.connection?.remoteAddress?.replace('::ffff:', '') || '';
};

module.exports = getClientIP;

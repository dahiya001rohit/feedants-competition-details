const jwt = require('jsonwebtoken');
const config = require('../config');
const { HttpError } = require('../lib/errors');

// Returns the user id from a Bearer token, null when no token is sent.
// A present-but-bad token is an error so the client knows to sign in again.
function readUserId(req) {
  const header = req.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  try {
    if (scheme !== 'Bearer' || !token) throw new Error();
    return jwt.verify(token, config.jwtSecret).sub;
  } catch {
    throw new HttpError(401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.');
  }
}

function optionalAuth(req, res, next) {
  req.userId = readUserId(req);
  next();
}

function requireAuth(req, res, next) {
  req.userId = readUserId(req);
  if (!req.userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
  next();
}

const signToken = (userId) => jwt.sign({}, config.jwtSecret, { subject: String(userId), expiresIn: '7d' });

module.exports = { optionalAuth, requireAuth, signToken };

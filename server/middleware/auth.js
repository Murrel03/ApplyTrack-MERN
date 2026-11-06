const jwt = require('jsonwebtoken');

/**
 * Protects a route: expects "Authorization: Bearer <token>".
 * On success attaches req.user = { id } (the token payload) and calls next().
 */
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Not authorised: no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorised: token is invalid or expired' });
  }
}

module.exports = auth;

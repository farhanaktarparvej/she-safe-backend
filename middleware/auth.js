const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Protects a route by checking for a valid JWT stored in the "token" cookie.
function requireAdminAuth(req, res, next) {
  const token = req.cookies ? req.cookies.token : null;

  if (!token) {
    return sendUnauthorized(res);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.role !== 'admin') {
      return sendUnauthorized(res);
    }

    req.admin = payload;
    next();
  } catch (err) {
    // covers invalid signature and expired tokens
    return sendUnauthorized(res);
  }
}

function sendUnauthorized(res) {
  return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
}

module.exports = { requireAdminAuth };

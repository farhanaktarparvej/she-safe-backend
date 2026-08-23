const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { requireAdminAuth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Running frontend and backend as two separate local servers (e.g. Live
// Server on :5500 talking to Express on :5000) is still cross-origin, but
// it's plain http:// with no TLS — so cookies need Secure=false and
// SameSite=Lax here. Flip these back to true/"none" once both sides are
// deployed behind HTTPS (see README).
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true'; // default false (local http)
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';

// simple in-memory rate limiting to slow down brute-force attempts
const attemptsByIp = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip) {
  const record = attemptsByIp.get(ip);
  if (!record) return false;

  const expired = Date.now() - record.firstAttempt > WINDOW_MS;
  if (expired) {
    attemptsByIp.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function registerFailedAttempt(ip) {
  const record = attemptsByIp.get(ip);
  if (!record || Date.now() - record.firstAttempt > WINDOW_MS) {
    attemptsByIp.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    record.count += 1;
  }
}

function clearAttempts(ip) {
  attemptsByIp.delete(ip);
}

// POST /api/admin/login  { password }
router.post('/login', async (req, res) => {
  const ip = req.ip;
  const { password } = req.body;

  if (isRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Too many failed attempts. Please try again in 15 minutes.',
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  if (!ADMIN_PASSWORD_HASH) {
    console.error('ADMIN_PASSWORD_HASH is not set in .env — see utils/generateHash.js');
    return res.status(500).json({ success: false, message: 'Server misconfigured.' });
  }

  const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (!isMatch) {
    registerFailedAttempt(ip);
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }

  clearAttempts(ip);

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  });

  return res.json({ success: true, message: 'Login successful.' });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
  });
  return res.json({ success: true, message: 'Logged out.' });
});

// GET /api/admin/check  -> used by the dashboard page to confirm the session is valid
router.get('/check', requireAdminAuth, (req, res) => {
  return res.json({ success: true, message: 'Authenticated.' });
});

module.exports = router;

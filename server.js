const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const { requireAdminAuth } = require('./middleware/auth');
const adminRoutes = require('./routes/admin');
const alertsRoutes = require('./routes/alerts'); // admin dashboard: read/manage SOS alerts
const sosRoutes = require('./routes/sos');        // hardware device (ESP32): submit SOS alerts

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS ---
// Credentialed (cookie-based) requests from the browser CANNOT use the
// wildcard "*" origin — the browser drops the response even on 200 OK.
// So we reflect back a specific, allow-listed origin instead, and turn
// credentials on explicitly.
//
// Add your frontend's origin to ALLOWED_ORIGINS in .env, comma-separated,
// e.g.: ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
const defaultDevOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://localhost:8080',
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .concat(defaultDevOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no Origin header, e.g. curl/Postman/the ESP32)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// simple request log so every hit (device or dashboard) shows up in the console
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- API routes ---
app.use('/api/admin', adminRoutes);

// Alerts data is admin-only, guarded by the same session cookie as the dashboard page.
app.use('/api/alerts', requireAdminAuth, alertsRoutes);

// Device-facing ingestion endpoint — auth is via the X-API-KEY header
// (see middleware/verifyApiKey.js), not the admin cookie, since the ESP32
// can't hold a browser session.
app.use('/api/v1/sos', sosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// This backend is API-only — the frontend is served separately (see
// frontend/README.md — open its HTML files directly or serve them with
// any static file server).
app.get('/', (req, res) => {
  res.json({ status: 'SHE SAFE backend is running', api: '/api/*' });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  SHE SAFE backend');
  console.log('========================================');
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`  Device SOS endpoint: http://localhost:${PORT}/api/v1/sos`);
  console.log('  Alerts are logged to console + backend/logs/sos.log');
  console.log('  and persisted in backend/data/alerts.json');
  console.log('========================================');
});

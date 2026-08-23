// Lightweight JSON-file "database" for SOS alerts.
//
// No MongoDB / external DB needed to run this backend locally — every
// alert (from the ESP32 device or the dashboard's "Simulate SOS") is
// appended to data/alerts.json, so data survives restarts.
//
// This keeps a full in-memory copy and rewrites the file on every change,
// which is more than fine for a hackathon-scale SOS device / small
// dashboard (dozens–thousands of alerts), not built for high write volume.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'alerts.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readAll() {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('[store] Failed to read/parse alerts.json, starting fresh:', err.message);
    return [];
  }
}

function writeAll(alerts) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(alerts, null, 2), 'utf8');
}

function create(fields) {
  const alerts = readAll();
  const now = new Date().toISOString();
  const alert = {
    _id: crypto.randomUUID(),
    name: fields.name || 'Unknown User',
    location: fields.location || '',
    deviceId: fields.deviceId || '',
    date: fields.date,
    time: fields.time,
    lat: fields.lat,
    long: fields.long,
    status: fields.status || 'Active',
    createdAt: now,
    updatedAt: now,
  };
  alerts.push(alert);
  writeAll(alerts);
  return alert;
}

function findAll(filter = {}) {
  const alerts = readAll();
  const filtered = alerts.filter((a) =>
    Object.entries(filter).every(([k, v]) => a[k] === v)
  );
  // most recent first
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function findById(id) {
  return readAll().find((a) => a._id === id) || null;
}

function updateById(id, updates) {
  const alerts = readAll();
  const idx = alerts.findIndex((a) => a._id === id);
  if (idx === -1) return null;
  alerts[idx] = { ...alerts[idx], ...updates, updatedAt: new Date().toISOString() };
  writeAll(alerts);
  return alerts[idx];
}

function deleteById(id) {
  const alerts = readAll();
  const idx = alerts.findIndex((a) => a._id === id);
  if (idx === -1) return false;
  alerts.splice(idx, 1);
  writeAll(alerts);
  return true;
}

function countByStatus(status) {
  const alerts = readAll();
  if (!status) return alerts.length;
  return alerts.filter((a) => a.status === status).length;
}

module.exports = { create, findAll, findById, updateById, deleteById, countByStatus };

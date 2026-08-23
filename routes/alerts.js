const express = require('express');
const router = express.Router();
const store = require('../store/alertStore');
const { logSos } = require('../store/logger');

/**
 * POST /api/alerts
 * Used by the dashboard's "Simulate SOS" form: date, time, lat, long
 * (+ optional name/location). Same store as the device route, so it
 * shows up on the map/table immediately.
 */
router.post('/', async (req, res) => {
  try {
    const { name, location, date, time, lat, long } = req.body;

    if (date === undefined || time === undefined || lat === undefined || long === undefined) {
      return res.status(400).json({
        error: 'date, time, lat and long are all required fields.',
      });
    }

    const latNum = Number(lat);
    const longNum = Number(long);

    if (Number.isNaN(latNum) || Number.isNaN(longNum)) {
      return res.status(400).json({ error: 'lat and long must be valid numbers.' });
    }
    if (latNum < -90 || latNum > 90 || longNum < -180 || longNum > 180) {
      return res.status(400).json({ error: 'lat/long values are out of range.' });
    }

    const alert = store.create({
      name,
      location,
      date,
      time,
      lat: latNum,
      long: longNum,
      status: 'Active',
    });

    logSos(alert);

    return res.status(201).json(alert);
  } catch (err) {
    console.error('Error creating alert:', err);
    return res.status(500).json({ error: 'Server error while saving alert.' });
  }
});

/**
 * GET /api/alerts
 * Return all alerts, most recent first.
 * Supports optional ?status=Active|Resolved filter.
 */
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    return res.json(store.findAll(filter));
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return res.status(500).json({ error: 'Server error while fetching alerts.' });
  }
});

/**
 * GET /api/alerts/stats/summary
 * Quick counts used by the dashboard's summary cards.
 */
router.get('/stats/summary', async (req, res) => {
  try {
    return res.json({
      total: store.countByStatus(),
      active: store.countByStatus('Active'),
      resolved: store.countByStatus('Resolved'),
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Server error while fetching stats.' });
  }
});

/**
 * GET /api/alerts/:id
 */
router.get('/:id', async (req, res) => {
  const alert = store.findById(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });
  return res.json(alert);
});

/**
 * PATCH /api/alerts/:id/resolve
 * Mark an alert as Resolved.
 */
router.patch('/:id/resolve', async (req, res) => {
  const alert = store.updateById(req.params.id, { status: 'Resolved' });
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });
  return res.json(alert);
});

/**
 * DELETE /api/alerts/:id
 */
router.delete('/:id', async (req, res) => {
  const ok = store.deleteById(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Alert not found.' });
  return res.json({ message: 'Alert deleted.' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const store = require('../store/alertStore');
const { logSos } = require('../store/logger');
const verifyApiKey = require('../middleware/verifyApiKey');

/**
 * PUT /api/v1/sos
 *
 * Endpoint for the ESP32 hardware device (she_safe_esp32.ino) to push an
 * SOS event. Field names below match the firmware's JSON body exactly.
 *
 * Required header:
 *   Content-Type: application/json
 *   X-API-KEY: <DEVICE_API_KEY from .env>
 *
 * Required JSON body ("Time" is capitalized on purpose — matches the firmware):
 *   {
 *     "device_id": "ESP32-SHE-SAFE-01",
 *     "latitude": "22.5726",
 *     "longitude": "88.3639",
 *     "date": "2026-08-24",
 *     "Time": "09:48"
 *   }
 *
 * On success (201) every event is:
 *   1. printed to the console
 *   2. appended to backend/logs/sos.log
 *   3. saved to backend/data/alerts.json, so it shows up on the admin
 *      dashboard immediately (status "Active")
 */
router.put('/', verifyApiKey, async (req, res) => {
  try {
    const { device_id, latitude, longitude, date, Time } = req.body;

    const missing = [];
    if (!device_id) missing.push('device_id');
    if (latitude === undefined || latitude === null || latitude === '') missing.push('latitude');
    if (longitude === undefined || longitude === null || longitude === '') missing.push('longitude');
    if (!date) missing.push('date');
    if (!Time) missing.push('Time');

    if (missing.length) {
      return res.status(400).json({
        error: `Missing required field(s): ${missing.join(', ')}`,
        expectedFormat: {
          device_id: 'string',
          latitude: 'number or numeric string',
          longitude: 'number or numeric string',
          date: 'string, e.g. "2026-08-24"',
          Time: 'string, e.g. "09:48"',
        },
      });
    }

    const lat = Number(latitude);
    const long = Number(longitude);

    if (Number.isNaN(lat) || Number.isNaN(long)) {
      return res.status(400).json({ error: 'latitude and longitude must be numeric.' });
    }
    if (lat < -90 || lat > 90 || long < -180 || long > 180) {
      return res.status(400).json({ error: 'latitude/longitude values are out of range.' });
    }

    const alert = await store.create({
      name: device_id,      // shows the device id in the "Name" column on the dashboard
      deviceId: device_id,
      date,
      time: Time,
      lat,
      long,
      status: 'Active',
    });

    logSos(alert, { ip: req.ip });

    return res.status(201).json({
      device_id: alert.deviceId,
      latitude: alert.lat,
      longitude: alert.long,
      Date: alert.date,
      Time: alert.time,
    });
  } catch (err) {
    console.error('Error saving device SOS alert:', err);
    return res.status(500).json({ error: 'Server error while saving alert.' });
  }
});

module.exports = router;

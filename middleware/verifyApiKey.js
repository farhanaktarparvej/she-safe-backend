// Verifies the "X-API-KEY" header against the secret configured in .env.
// This is what the ESP32 firmware sends on every PUT /api/v1/sos request —
// any request without a matching key is rejected before it touches the store.
module.exports = function verifyApiKey(req, res, next) {
  const providedKey = req.header('X-API-KEY');
  const expectedKey = process.env.DEVICE_API_KEY;

  if (!expectedKey) {
    console.warn('DEVICE_API_KEY is not set in .env — rejecting all device requests.');
    return res.status(500).json({ error: 'Server is missing DEVICE_API_KEY configuration.' });
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: 'Missing or invalid X-API-KEY header.' });
  }

  next();
};

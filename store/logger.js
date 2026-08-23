// Very small file logger — every SOS event (and a few other things worth
// an audit trail) gets one line appended to logs/sos.log, in addition to
// being printed to the console. Plain text, newest line at the bottom.

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'sos.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logSos(alert, meta = {}) {
  ensureLogDir();
  const line =
    `[${new Date().toISOString()}] SOS RECEIVED ` +
    `device=${alert.deviceId || 'n/a'} ` +
    `name=${alert.name} ` +
    `lat=${alert.lat} long=${alert.long} ` +
    `date=${alert.date} time=${alert.time} ` +
    `id=${alert._id}` +
    (meta.ip ? ` from_ip=${meta.ip}` : '');

  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

module.exports = { logSos };

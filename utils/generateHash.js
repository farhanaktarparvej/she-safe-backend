// Run this whenever you want to set/change the admin password:
//   node utils/generateHash.js "yourNewPassword"
// Copy the printed hash into .env as ADMIN_PASSWORD_HASH

const bcrypt = require('bcryptjs');

const newPassword = process.argv[2];

if (!newPassword) {
  console.log('Usage: node utils/generateHash.js "yourChosenAdminPassword"');
  process.exit(1);
}

const hash = bcrypt.hashSync(newPassword, 10);
console.log('\nPaste this into your .env file as ADMIN_PASSWORD_HASH:\n');
console.log(hash);
console.log('');

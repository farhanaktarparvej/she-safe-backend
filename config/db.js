// MongoDB connection helper (Mongoose).
//
// Reads MONGODB_URI from .env. For local development this is usually
// mongodb://127.0.0.1:27017/she-safe (a local mongod), or a mongodb+srv://
// connection string from MongoDB Atlas's free tier for anything shared /
// deployed. See README.md for setup instructions.

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set in .env — see README.md for how to get a connection string.'
    );
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);

  console.log(`  MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });
}

module.exports = { connectDB };
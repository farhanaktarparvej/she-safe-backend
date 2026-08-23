// SOS alert storage — backed by MongoDB (Mongoose).
//
// Same function names/shapes as the old JSON-file store, so routes/*.js
// didn't need to change: create/findAll/findById/updateById/deleteById/
// countByStatus. Every function is now async (Mongo I/O), which routes
// already `await` since they're inside async handlers.

const mongoose = require('mongoose');
const Alert = require('../models/Alert');

function create(fields) {
  return Alert.create({
    name: fields.name || 'Unknown User',
    location: fields.location || '',
    deviceId: fields.deviceId || '',
    date: fields.date,
    time: fields.time,
    lat: fields.lat,
    long: fields.long,
    status: fields.status || 'Active',
  }).then((doc) => doc.toJSON());
}

async function findAll(filter = {}) {
  const docs = await Alert.find(filter).sort({ createdAt: -1 });
  return docs.map((doc) => doc.toJSON());
}

async function findById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await Alert.findById(id);
  return doc ? doc.toJSON() : null;
}

async function updateById(id, updates) {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await Alert.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  return doc ? doc.toJSON() : null;
}

async function deleteById(id) {
  if (!mongoose.isValidObjectId(id)) return false;
  const doc = await Alert.findByIdAndDelete(id);
  return !!doc;
}

async function countByStatus(status) {
  if (!status) return Alert.countDocuments();
  return Alert.countDocuments({ status });
}

module.exports = { create, findAll, findById, updateById, deleteById, countByStatus };
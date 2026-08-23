// Mongoose schema for an SOS alert — same shape the JSON store used to
// produce, so nothing downstream (routes, dashboard) needs to change.

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Unknown User' },
    location: { type: String, default: '' },
    deviceId: { type: String, default: '', index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    long: { type: Number, required: true, min: -180, max: 180 },
    status: { type: String, enum: ['Active', 'Resolved'], default: 'Active', index: true },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        ret._id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Most-recent-first is how every list endpoint reads alerts back.
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
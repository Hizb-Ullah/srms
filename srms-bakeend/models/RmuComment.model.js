const mongoose = require('mongoose')

// Standalone RMU → Surveyor comments (not tied to a lot request).
// Used when the officer cannot load/find the surveyor's file on New Arrivals
// and needs to notify the surveyor directly.
const rmuCommentSchema = new mongoose.Schema({
  surveyor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

module.exports = mongoose.model('RmuComment', rmuCommentSchema)

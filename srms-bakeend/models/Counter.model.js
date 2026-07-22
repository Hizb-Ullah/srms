const mongoose = require('mongoose')

// Generic atomic counter — used to safely generate sequential plot/DSM/OS/SR
// numbers even when multiple requests are created concurrently.
const counterSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  seq: { type: Number, default: 0 }
})

module.exports = mongoose.model('Counter', counterSchema)

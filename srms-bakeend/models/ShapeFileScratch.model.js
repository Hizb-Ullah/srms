const mongoose = require('mongoose')

// Before submitting a full layout, a surveyor sends a surveyed shape file
// straight to the File Controller (not via RMU) to run a "Scratch" — a data
// consistency check against an existing Parent plot or General Plan record.
// Controller sends it to Capturing, who mark it Passed/Failed with an
// uploaded report; the result then goes back to the Controller and is
// automatically visible to the surveyor.
const shapeFileScratchSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // What this scratch is being checked against — an existing Parent plot or
  // General Plan record, identified by its SR#/DSM#.
  linkType: { type: String, enum: ['parent', 'general_plan'], required: true },
  referenceSrNumber: { type: String, required: true },
  referenceDsmNumber: { type: String, required: true },

  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },

  status: {
    type: String,
    enum: ['received_from_surveyor', 'sent_to_capturing', 'forwarded_to_surveyor'],
    default: 'received_from_surveyor'
  },
  sentToCapturingBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentToCapturingAt: { type: Date },

  // Capturing's outcome — "In Progress" (displayed) simply means sent to
  // capturing but this is still null.
  capturingOutcome: { type: String, enum: ['passed', 'failed', null], default: null },
  reportUrl: { type: String, default: '' },
  reportFileName: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('ShapeFileScratch', shapeFileScratchSchema)

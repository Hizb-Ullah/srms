const mongoose = require('mongoose')

// Per client: the surveyor requests "framing data" by entering the Lot
// Number and Village of the record they're asking about. Client confirmed
// this follows the same route as Shape File Scratch: goes directly to the
// File Controller (not RMU), Controller sends it to Capturing, Capturing
// marks it Passed/Failed with an optional report, and the result goes back
// to the Controller and is automatically visible to the surveyor.
const framingDataRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lotNumber: { type: String, required: true, trim: true },
  village: { type: String, required: true, trim: true },

  status: {
    type: String,
    enum: ['received_from_surveyor', 'sent_to_capturing', 'forwarded_to_surveyor'],
    default: 'received_from_surveyor'
  },
  sentToCapturingBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentToCapturingAt: { type: Date },

  capturingOutcome: { type: String, enum: ['passed', 'failed', null], default: null },
  reportUrl: { type: String, default: '' },
  reportFileName: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('FramingDataRequest', framingDataRequestSchema)

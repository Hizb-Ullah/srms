const mongoose = require('mongoose')

// Each plot in a request carries its own independent DSM# and OS# — per
// client confirmation, DSM# is never shared across a subdivision batch and
// OS# does not auto-inherit from the parent plot.
const plotEntrySchema = new mongoose.Schema({
  plotNumber: { type: String, required: true },
  surveyRecordNumber: { type: String, required: true },
  dsmNumber: { type: String, required: true },
  osNumber: { type: String, required: true },
  cadastreNumber: { type: String, default: '' }
}, { _id: false })

const lotAllocationRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: String, enum: ['Private', 'LandBoard'], required: true },
  village: { type: String, required: true },
  landBoard: { type: String, default: '' },
  requestType: {
    type: String,
    enum: ['single_plot', 'multiple_plot', 'subdivision'],
    required: true
  },
  surveyorCode: { type: String },
  parentPlotNumber: { type: String },
  subdivisionRange: {
    from: String,
    to: String
  },
  plots: { type: [plotEntrySchema], default: [] },
  status: {
    type: String,
    enum: [
      'pending_allocator_review',
      'awaiting_payment',
      'pop_uploaded',
      'payment_confirmed',
      'approved',
      'rejected'
    ],
    default: 'pending_allocator_review'
  },
  popDocumentUrl: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  paymentMarkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMarkedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  accountsEmailSentAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('LotAllocationRequest', lotAllocationRequestSchema)

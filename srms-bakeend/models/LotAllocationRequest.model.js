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
  // Auto-populated from village (City / Town / Urban Village / Village)
  locationType: { type: String, default: '' },
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
  accountsEmailSentAt: { type: Date },

  // ---------------- RMU (Records Management Unit) tracking ----------------
  // Records are submitted physically by surveyors; RMU records them here,
  // submits them to the Controller, receives them back once approved / not
  // approved, and finally marks them as collected by the surveyor.
  rmuStatus: {
    type: String,
    enum: [
      'received_from_surveyor',
      'submitted_to_controller',
      'returned_from_controller',
      'collected'
    ],
    default: null
  },
  rmuOutcome: { type: String, enum: ['approved', 'not_approved', null], default: null },
  rmuReceivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rmuReceivedAt: { type: Date },
  rmuSubmittedToControllerAt: { type: Date },
  rmuReturnedAt: { type: Date },
  rmuCollectedAt: { type: Date },
  rmuNotes: { type: String, default: '' },

  // Payment receipt / invoice number entered by RMU (surveyors attach a copy
  // of the payment receipt with their physical file). Once entered, the Lot
  // Allocator's Active Requests list shows the request as "Paid".
  paymentReceiptNumber: { type: String, default: '' },
  receiptEnteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiptEnteredAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('LotAllocationRequest', lotAllocationRequestSchema)

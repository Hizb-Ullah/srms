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
  cadastreNumber: { type: String, default: '' },
  requestType: {
    type: String,
    enum: ['single_plot', 'multiple_plot', 'subdivision', 'sectional_title', 'general_plan', 'borehole'],
    required: true
  },
  surveyorCode: { type: String },
  parentPlotNumber: { type: String },
  // Subdivision/Sectional Title/General Plan only: was the parent plot
  // already approved (does it already have a plot number)? If not, the
  // parent has no pre-existing number to reference — it gets minted as the
  // first plot number in this same batch, and the subdivision plots follow.
  parentAlreadyApproved: { type: Boolean, default: true },
  // Sectional Title only — replaces a unit count: the scheme itself gets one
  // registration number, named by the surveyor (per client correction).
  sectionalSchemeName: { type: String },
  subdivisionRange: {
    from: String,
    to: String
  },
  plots: { type: [plotEntrySchema], default: [] },
  // Set only when this is the first-ever request for a village: plot number
  // assignment is deferred until the Lot Allocator reviews it and supplies a
  // starting number — surveyors never assign their own plot numbers.
  pendingPlotCount: { type: Number },
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
      'collected',
      'in_storage'
    ],
    default: null
  },
  rmuOutcome: { type: String, enum: ['approved', 'not_approved', null], default: null },
  rmuReceivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rmuReceivedAt: { type: Date },
  rmuSubmittedToControllerAt: { type: Date },
  rmuReturnedAt: { type: Date },
  rmuCollectedAt: { type: Date },
  rmuStorageAt: { type: Date },

  // ------------- Controller workflow (per client's Controller schema) -------
  // Files arrive from RMU (received, not yet assigned) and move through:
  // Registration & Reservation → Capturing → Examination → Approval,
  // with send/receive at each stage; at any action point the Controller can
  // return the file to the RMU.
  controllerStage: {
    type: String,
    enum: [
      'received_unassigned',
      'sent_to_registration',
      'received_from_registration',
      'sent_to_capturing',
      'received_from_capturing',
      'sent_to_examination',
      'received_from_examination',
      'sent_to_approval',
      'received_from_approval',
      'returned_to_rmu'
    ],
    default: null
  },
  controllerStageUpdatedAt: { type: Date },
  controllerHistory: [{
    stage: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }],
  // Job-claiming for the current file-section queue (Registration/Capturing/
  // Examination/Approval): since more than one officer can work a section,
  // whoever clicks "Accept Job" locks it to themselves — it moves to their
  // own "Awaiting Action" and no one else can act on it. Reset whenever the
  // Controller sends the file to a new section.
  sectionClaimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sectionClaimedAt: { type: Date, default: null },
  rmuNotes: { type: String, default: '' },
  // Comments sent by RMU to the surveyor about this file
  rmuComments: [{
    message: { type: String, required: true },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now }
  }],

  // ------- File section outcomes (Examination / Approval sub-role actions) -------
  // Recorded when the File Examination / File Approval sub-role takes their
  // action on a file the Controller sent them (per client's workflow schema).
  examinationOutcome: { type: String, enum: ['pass', 'fail', null], default: null },
  approvalOutcome: { type: String, enum: ['pass', 'fail', null], default: null },
  // Comments sent by a file-section sub-role (Registration/Capturing/
  // Examination/Approval) to the surveyor about this file.
  controllerComments: [{
    stage: { type: String, enum: ['registration', 'capturing', 'examination', 'approval'] },
    message: { type: String, required: true },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now }
  }],

  // Payment receipt / invoice number entered by RMU (surveyors attach a copy
  // of the payment receipt with their physical file). Once entered, the Lot
  // Allocator's Active Requests list shows the request as "Paid".
  paymentReceiptNumber: { type: String, default: '' },
  receiptEnteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiptEnteredAt: { type: Date },

  // ---------------- Accounts (per client's Accounts schema) ----------------
  // After final authorisation, Accounts logs the payment against the
  // request's SR# with their own official receipt number — bookkeeping
  // only, does not affect the lot-allocation/RMU/Controller pipeline.
  accountsReceiptNumber: { type: String, default: '' },
  accountsAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accountsAcceptedAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('LotAllocationRequest', lotAllocationRequestSchema)

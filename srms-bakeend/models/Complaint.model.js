const mongoose = require('mongoose')

const complaintSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestId:   { type: mongoose.Schema.Types.ObjectId, ref: 'LotAllocationRequest', required: true },
  message:     { type: String, required: true, trim: true },
  status:      { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:  { type: Date },
  resolution:  { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Complaint', complaintSchema)

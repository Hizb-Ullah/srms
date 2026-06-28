const mongoose = require('mongoose')

const stageSchema = new mongoose.Schema({
  name: String,
  status: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: String,
  timestamp: Date
})

const fileSchema = new mongoose.Schema({
  plotNumber: {
    type: String,
    required: true
  },
  surveyRecordNumber: {
    type: String,
    required: true
  },
  surveyorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
 status: {
    type: String,
    enum: ['submitted', 'capturing', 'examination', 'approval', 'dispatch', 'archived', 'rework', 'rejected', 'appealed'],
    default: 'submitted'
  },
  appealCount: {
    type: Number,
    default: 0
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionRemarks: String,
  currentStage: {
    type: String,
    default: 'submitted'
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  stages: [stageSchema],
  documents: [{
    url: String,
    name: String,
    uploadedAt: Date
  }]
}, { timestamps: true })

module.exports = mongoose.model('File', fileSchema)
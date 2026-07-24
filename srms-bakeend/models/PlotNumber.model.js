const mongoose = require('mongoose')

const plotNumberSchema = new mongoose.Schema({
  plotNumber: { type: String, unique: true },
  surveyRecordNumber: { type: String, unique: true },
  surveyorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAssigned: { type: Boolean, default: false },
  requestType: { type: String, enum: ['single_plot', 'trans_plot'], default: 'single_plot' },
  location: { type: String, default: '' },
  cadastreNumber: { type: String, default: '' },
  landBoard: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('PlotNumber', plotNumberSchema)
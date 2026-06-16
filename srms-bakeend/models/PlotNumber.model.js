const mongoose = require('mongoose')

const plotNumberSchema = new mongoose.Schema({
  plotNumber: { 
    type: String, 
    unique: true 
  },
  surveyRecordNumber: { 
    type: String, 
    unique: true 
  },
  surveyorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  isAssigned: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true })

module.exports = mongoose.model('PlotNumber', plotNumberSchema)
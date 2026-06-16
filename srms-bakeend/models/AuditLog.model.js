const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  fileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'File' 
  },
  action: String,
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  role: String,
  remarks: String,
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
})

module.exports = mongoose.model('AuditLog', auditLogSchema)
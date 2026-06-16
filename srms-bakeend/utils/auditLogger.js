const AuditLog = require('../models/AuditLog.model')

const logAction = async ({ fileId, action, performedBy, role, remarks }) => {
  try {
    await AuditLog.create({
      fileId,
      action,
      performedBy,
      role,
      remarks,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Audit log error:', error.message)
  }
}

module.exports = logAction
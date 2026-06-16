const express = require('express')
const router = express.Router()
const {
  submitFile,
  getMyFiles,
  getFile,
  getAllFiles,
  getFileAudit
} = require('../controllers/file.controller')
const { protect, authorize } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')

// All routes require login
router.use(protect)

// Surveyor routes
router.post('/submit', 
  authorize('surveyor'), 
  upload.array('documents', 10), 
  submitFile
)
router.get('/my', authorize('surveyor'), getMyFiles)

// Shared routes
router.get('/:id', getFile)
router.get('/:id/audit', getFileAudit)

// Officer, approver, admin only
router.get('/', authorize('officer', 'approver', 'admin'), getAllFiles)

module.exports = router
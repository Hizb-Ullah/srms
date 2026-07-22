const express = require('express')
const router = express.Router()
const {
  processGate,
  rejectFile,
  appealFile,
  updateFile,
  resubmitFile,
  deleteDocument,
  getQueue
} = require('../controllers/workflow.controller')
const { protect, authorize } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')

router.use(protect)

router.patch('/:fileId/gate',     authorize('officer', 'approver'), processGate)
router.patch('/:fileId/reject',   authorize('officer', 'approver', 'admin'), rejectFile)
router.patch('/:fileId/appeal',   authorize('surveyor'), appealFile)
router.patch('/:fileId/update',   authorize('surveyor'), upload.array('documents', 10), updateFile)
router.patch('/:fileId/resubmit', authorize('surveyor'), resubmitFile)
router.delete('/:fileId/documents/:docIndex', authorize('surveyor'), deleteDocument)
router.get('/queue',              authorize('officer', 'approver'), getQueue)

module.exports = router
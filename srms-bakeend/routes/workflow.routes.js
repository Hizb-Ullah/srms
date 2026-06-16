const express = require('express')
const router = express.Router()
const { 
  processGate, 
  resubmitFile, 
  getQueue 
} = require('../controllers/workflow.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// All routes require login
router.use(protect)

// Officer and approver — process a gate
router.patch(
  '/:fileId/gate',
  authorize('officer', 'approver'),
  processGate
)

// Surveyor — resubmit after rework
router.patch(
  '/:fileId/resubmit',
  authorize('surveyor'),
  resubmitFile
)

// Officer and approver — get their queue
router.get(
  '/queue',
  authorize('officer', 'approver'),
  getQueue
)

module.exports = router
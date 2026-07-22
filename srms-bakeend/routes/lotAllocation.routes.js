const express = require('express')
const router = express.Router()
const {
  createLotRequest,
  reviewRequest,
  uploadPop,
  markPaymentReceived,
  approveRequest,
  rejectRequest,
  getMyRequests,
  getAllRequests,
  getLastPlotNumber
} = require('../controllers/lotAllocation.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')

router.use(protect)

// Surveyor (Private / Land Board) routes
router.post('/', authorizeCapability('submit_lot_request'), createLotRequest)
router.get('/my', authorizeCapability('submit_lot_request'), getMyRequests)
router.post('/:id/pop', authorizeCapability('upload_pop'), upload.single('pop'), uploadPop)

// DSM routes (Lot Allocator / Files Controller / Director)
router.get('/', authorizeCapability('review_lot_request', 'approve_lot_request', 'view_lot_requests'), getAllRequests)
router.patch('/:id/review', authorizeCapability('review_lot_request'), reviewRequest)
router.patch('/:id/payment-received', authorizeCapability('mark_payment_received'), markPaymentReceived)
router.patch('/:id/approve', authorizeCapability('approve_lot_request'), approveRequest)
router.patch('/:id/reject', authorizeCapability('reject_lot_request'), rejectRequest)

// Shared helper
router.get('/villages/:village/last-plot-number', getLastPlotNumber)

module.exports = router

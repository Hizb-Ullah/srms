const express = require('express')
const router = express.Router()
const { submitComplaint, getAllComplaints, getMyComplaints, resolveComplaint } = require('../controllers/complaint.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')

router.use(protect)

// Surveyor routes
router.post('/lot-requests/:requestId', authorizeCapability('submit_lot_request'), submitComplaint)
router.get('/my', authorizeCapability('submit_lot_request'), getMyComplaints)

// DSM staff routes
router.get('/', authorizeCapability('view_lot_requests', 'review_lot_request', 'approve_lot_request'), getAllComplaints)
router.patch('/:id/resolve', authorizeCapability('review_lot_request', 'approve_lot_request'), resolveComplaint)

module.exports = router

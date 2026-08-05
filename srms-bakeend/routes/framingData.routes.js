const express = require('express')
const router = express.Router()
const {
  submitFramingDataRequest,
  getMyFramingDataRequests,
  getControllerFramingDataRequests,
  sendFramingDataToCapturing,
  getCapturingFramingDataQueue,
  getCapturingFramingDataCompleted,
  reviewFramingDataCapturing
} = require('../controllers/framingData.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')

router.use(protect)

// Surveyor (Private / Land Board)
router.post('/', authorizeCapability('submit_lot_request'), submitFramingDataRequest)
router.get('/my', authorizeCapability('submit_lot_request'), getMyFramingDataRequests)

// File Controller (Files Controller / Director via '*')
router.get('/controller',              authorizeCapability('controller_workflow'), getControllerFramingDataRequests)
router.patch('/:id/send-to-capturing', authorizeCapability('controller_workflow'), sendFramingDataToCapturing)

// File Capturing
router.get('/capturing/queue',     authorizeCapability('capture_file'), getCapturingFramingDataQueue)
router.get('/capturing/completed', authorizeCapability('capture_file'), getCapturingFramingDataCompleted)
router.patch('/:id/review',        authorizeCapability('capture_file'), upload.single('report'), reviewFramingDataCapturing)

module.exports = router

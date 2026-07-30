const express = require('express')
const router = express.Router()
const {
  submitScratch,
  getMyScratchRequests,
  getControllerScratchRequests,
  sendScratchToCapturing,
  getCapturingScratchQueue,
  getCapturingScratchCompleted,
  reviewScratchCapturing
} = require('../controllers/shapeFileScratch.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')

router.use(protect)

// Surveyor (Private / Land Board)
router.post('/', authorizeCapability('submit_shape_scratch'), upload.single('file'), submitScratch)
router.get('/my', authorizeCapability('submit_shape_scratch'), getMyScratchRequests)

// File Controller (Files Controller / Director via '*')
router.get('/controller',              authorizeCapability('controller_workflow'), getControllerScratchRequests)
router.patch('/:id/send-to-capturing', authorizeCapability('controller_workflow'), sendScratchToCapturing)

// File Capturing
router.get('/capturing/queue',     authorizeCapability('capture_file'), getCapturingScratchQueue)
router.get('/capturing/completed', authorizeCapability('capture_file'), getCapturingScratchCompleted)
router.patch('/:id/review',        authorizeCapability('capture_file'), upload.single('report'), reviewScratchCapturing)

module.exports = router

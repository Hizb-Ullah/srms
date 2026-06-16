const express = require('express')
const router = express.Router()
const { 
  requestPlotNumber, 
  getMyPlotNumbers,
  getPlotNumber,
  getAllPlotNumbers
} = require('../controllers/plot.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// All routes require login
router.use(protect)

// Surveyor routes
router.post('/request', authorize('surveyor'), requestPlotNumber)
router.get('/my', authorize('surveyor'), getMyPlotNumbers)

// Shared routes
router.get('/:id', getPlotNumber)

// Admin and officer only
router.get('/', authorize('admin', 'officer'), getAllPlotNumbers)

module.exports = router
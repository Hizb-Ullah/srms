const express = require('express')
const router = express.Router()
const { 
  requestPlotNumber, 
  getMyPlotNumbers,
  getPlotNumber,
  getAllPlotNumbers,
  searchByPlotNumber,
  deletePlotNumber
} = require('../controllers/plot.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

// All routes require login
router.use(protect)

// Surveyor routes
router.post('/request', authorize('surveyor'), requestPlotNumber)
router.get('/my', authorize('surveyor'), getMyPlotNumbers)
router.delete('/:id', authorize('surveyor'), deletePlotNumber)

// Shared routes
router.get('/:id', getPlotNumber)

// Admin and officer only
router.get('/', authorize('admin', 'officer'), getAllPlotNumbers)
router.get('/search/:plotNumber', searchByPlotNumber)

module.exports = router
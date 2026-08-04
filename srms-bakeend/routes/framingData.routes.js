const express = require('express')
const router = express.Router()
const { submitFramingDataRequest, getMyFramingDataRequests } = require('../controllers/framingData.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')

router.use(protect)

router.post('/', authorizeCapability('submit_lot_request'), submitFramingDataRequest)
router.get('/my', authorizeCapability('submit_lot_request'), getMyFramingDataRequests)

module.exports = router

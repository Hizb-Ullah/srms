const express = require('express')
const router = express.Router()
const {
  searchRecord,
  getRmuRecords,
  addNewArrival,
  receiveRecord,
  enterReceiptNumber,
  submitToController,
  receiveBackFromController,
  getPendingCollections,
  markCollected,
  sendSurveyorComment,
  sendStandaloneComment,
  getStandaloneComments,
  sendToStorage
} = require('../controllers/rmu.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')

router.use(protect)

// RMU sub-role (plus Files Controller / Director via '*')
router.post('/comments',             authorizeCapability('rmu_manage'), sendStandaloneComment)
router.get('/comments',              authorizeCapability('rmu_manage'), getStandaloneComments)
router.get('/search',                authorizeCapability('rmu_manage'), searchRecord)
router.get('/records',               authorizeCapability('rmu_manage'), getRmuRecords)
router.post('/new-arrival',          authorizeCapability('rmu_manage'), addNewArrival)
router.get('/pending-collections',   authorizeCapability('rmu_manage'), getPendingCollections)
router.patch('/:id/receive',         authorizeCapability('rmu_manage'), receiveRecord)
router.patch('/:id/receipt',         authorizeCapability('rmu_manage'), enterReceiptNumber)
router.patch('/:id/submit-controller', authorizeCapability('rmu_manage'), submitToController)
router.patch('/:id/return',          authorizeCapability('rmu_manage'), receiveBackFromController)
router.patch('/:id/comment',         authorizeCapability('rmu_manage'), sendSurveyorComment)
router.patch('/:id/storage',         authorizeCapability('rmu_manage'), sendToStorage)
router.patch('/:id/collect',         authorizeCapability('rmu_manage'), markCollected)

module.exports = router

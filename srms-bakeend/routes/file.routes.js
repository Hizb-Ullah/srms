const express = require('express')
const router = express.Router()
const {
  submitFile,
  getMyFiles,
  getFile,
  getAllFiles,
  getFileAudit,
  updateFile
} = require('../controllers/file.controller')
const { protect, authorize } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')

router.use(protect)

router.post('/submit',
  authorize('surveyor'),
  upload.array('documents', 10),
  submitFile
)
router.get('/my', authorize('surveyor'), getMyFiles)
router.patch('/:id',
  authorize('surveyor'),
  upload.array('documents', 10),
  updateFile
)

router.get('/:id', getFile)
router.get('/:id/audit', getFileAudit)

router.get('/', authorize('officer', 'approver', 'admin'), getAllFiles)

module.exports = router
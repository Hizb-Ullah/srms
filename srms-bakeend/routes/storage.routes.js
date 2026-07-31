const express = require('express')
const router = express.Router()
const { getStorageFiles } = require('../controllers/storage.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')

router.use(protect)

router.get('/files', authorizeCapability('storage_manage'), getStorageFiles)

module.exports = router

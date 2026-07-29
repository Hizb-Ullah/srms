const express = require('express')
const router = express.Router()
const { getControllerFiles, moveStage, returnToRmu } = require('../controllers/controllerWorkflow.controller')
const { protect, authorizeCapability } = require('../middleware/auth.middleware')

router.use(protect)

// Files Controller / Director (via '*')
router.get('/files',            authorizeCapability('controller_workflow'), getControllerFiles)
router.patch('/:id/stage',      authorizeCapability('controller_workflow'), moveStage)
router.patch('/:id/return-rmu', authorizeCapability('controller_workflow'), returnToRmu)

module.exports = router

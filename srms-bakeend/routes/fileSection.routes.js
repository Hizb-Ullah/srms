const express = require('express')
const router = express.Router()
const {
  SECTIONS,
  getSectionQueue,
  getMyAwaitingAction,
  acceptSectionJob,
  getSectionCompleted,
  takeSectionAction,
  sendSectionComment
} = require('../controllers/fileSection.controller')
const { protect } = require('../middleware/auth.middleware')
const { hasCapability } = require('../config/permissions')
const upload = require('../middleware/upload.middleware')

router.use(protect)

// Only the sub-role owning this section (or '*' — Director / Files Controller)
// may act on it, chosen dynamically from the :section param.
const authorizeSection = (req, res, next) => {
  const config = SECTIONS[req.params.section]
  if (!config) return res.status(404).json({ success: false, message: 'Unknown section' })
  const ok = config.capabilities.some((cap) => hasCapability(req.user, cap))
  if (!ok) {
    return res.status(403).json({
      success: false,
      message: `Your role (${req.user.group || 'none'} / ${req.user.subRole || 'none'}) is not authorized for ${config.label}`
    })
  }
  next()
}

router.get('/:section/queue',         authorizeSection, getSectionQueue)
router.get('/:section/my-queue',      authorizeSection, getMyAwaitingAction)
router.patch('/:section/:id/accept',  authorizeSection, acceptSectionJob)
router.get('/:section/completed',     authorizeSection, getSectionCompleted)
router.patch('/:section/:id/action',  authorizeSection, takeSectionAction)
router.patch('/:section/:id/comment', authorizeSection, upload.single('file'), sendSectionComment)

module.exports = router

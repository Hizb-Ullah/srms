const express = require('express')
const router = express.Router()
const {
  getAllUsers,
  toggleUserLock,
  getDashboardStats,
  getAuditLogs
} = require('../controllers/admin.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

router.use(protect)
router.use(authorize('admin'))

router.get('/users',           getAllUsers)
router.patch('/users/:id/lock', toggleUserLock)
router.get('/dashboard',       getDashboardStats)
router.get('/audit-logs',      getAuditLogs)

module.exports = router
const express = require('express')
const router = express.Router()
const {
  getAllUsers,
  toggleUserLock,
  getDashboardStats,
  getAuditLogs,
  createUser,
  approveUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getResetRequests,
  resolveResetRequest
} = require('../controllers/admin.controller')
const { protect, authorize, authorizeCapability } = require('../middleware/auth.middleware')

router.use(protect)

// Admin-only routes
router.get('/users',                  authorize('admin'), getAllUsers)
router.post('/users',                 authorize('admin'), createUser)
router.put('/users/:id',              authorize('admin'), updateUser)
router.delete('/users/:id',           authorize('admin'), deleteUser)
router.patch('/users/:id/lock',       authorize('admin'), toggleUserLock)
router.patch('/users/:id/reset-password', authorize('admin'), resetUserPassword)
router.get('/dashboard',              authorize('admin'), getDashboardStats)
router.get('/audit-logs',             authorize('admin'), getAuditLogs)
router.get('/reset-requests',         authorize('admin'), getResetRequests)
router.patch('/reset-requests/:id/resolve', authorize('admin'), resolveResetRequest)

// Director approves pending user accounts
router.patch('/users/:id/approve',    authorizeCapability('approve_users'), approveUser)

module.exports = router
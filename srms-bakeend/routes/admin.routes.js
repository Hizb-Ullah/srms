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
router.get('/users',                  authorize('admin', 'director'), getAllUsers)
router.post('/users',                 authorize('admin', 'director'), createUser)
router.put('/users/:id',              authorize('admin', 'director'), updateUser)
router.delete('/users/:id',           authorize('admin', 'director'), deleteUser)
router.patch('/users/:id/lock',       authorize('admin', 'director'), toggleUserLock)
router.patch('/users/:id/reset-password', authorize('admin', 'director'), resetUserPassword)
router.get('/dashboard',              authorize('admin', 'director'), getDashboardStats)
router.get('/audit-logs',             authorize('admin', 'director'), getAuditLogs)
router.get('/reset-requests',         authorize('admin', 'director'), getResetRequests)
router.patch('/reset-requests/:id/resolve', authorize('admin', 'director'), resolveResetRequest)

// Admin approves Director accounts
router.patch('/users/:id/approve',    authorize('admin'), approveUser)

module.exports = router
const express = require('express')
const router = express.Router()
const {
  getAllUsers,
  toggleUserLock,
  getDashboardStats,
  getAuditLogs,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getResetRequests,
  resolveResetRequest
} = require('../controllers/admin.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

router.use(protect)
router.use(authorize('admin'))

router.get('/users',                  getAllUsers)
router.post('/users',                 createUser)
router.put('/users/:id',              updateUser)
router.delete('/users/:id',           deleteUser)
router.patch('/users/:id/lock',       toggleUserLock)
router.patch('/users/:id/reset-password', resetUserPassword)
router.get('/dashboard',              getDashboardStats)
router.get('/audit-logs',             getAuditLogs)
router.get('/reset-requests',                getResetRequests)
router.patch('/reset-requests/:id/resolve',  resolveResetRequest)

module.exports = router
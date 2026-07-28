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

// Helper: admin role OR DSM Director subRole
const isAdminOrDirector = (req, res, next) => {
  const u = req.user
  if (u.role === 'admin' || (u.group === 'DSM' && u.subRole === 'Director')) return next()
  return res.status(403).json({ message: 'Not authorized' })
}

// Admin or Director routes
router.get('/users',                  isAdminOrDirector, getAllUsers)
router.post('/users',                 isAdminOrDirector, createUser)
router.put('/users/:id',              isAdminOrDirector, updateUser)
router.delete('/users/:id',           isAdminOrDirector, deleteUser)
router.patch('/users/:id/lock',       isAdminOrDirector, toggleUserLock)
router.patch('/users/:id/reset-password', isAdminOrDirector, resetUserPassword)
router.get('/dashboard',              isAdminOrDirector, getDashboardStats)
router.get('/audit-logs',             isAdminOrDirector, getAuditLogs)
router.get('/reset-requests',         isAdminOrDirector, getResetRequests)
router.patch('/reset-requests/:id/resolve', isAdminOrDirector, resolveResetRequest)

// Approve user accounts
router.patch('/users/:id/approve',    isAdminOrDirector, approveUser)

module.exports = router
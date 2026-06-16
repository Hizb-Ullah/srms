const User = require('../models/User.model')
const File = require('../models/File.model')
const PlotNumber = require('../models/PlotNumber.model')
const AuditLog = require('../models/AuditLog.model')

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: users.length, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Lock or unlock a user
const toggleUserLock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.isLocked = !user.isLocked
    user.failedLoginAttempts = 0
    await user.save()

    res.status(200).json({
      success: true,
      message: `User ${user.isLocked ? 'locked' : 'unlocked'} successfully`,
      data: { id: user._id, name: user.name, isLocked: user.isLocked }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers    = await User.countDocuments()
    const totalFiles    = await File.countDocuments()
    const totalPlots    = await PlotNumber.countDocuments()

    const filesByStatus = await File.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])

    const recentFiles = await File.find()
      .populate('surveyorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)

    const recentLogs = await AuditLog.find()
      .populate('performedBy', 'name role')
      .sort({ timestamp: -1 })
      .limit(10)

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalFiles,
        totalPlots,
        filesByStatus,
        usersByRole,
        recentFiles,
        recentLogs
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get all audit logs
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name role')
      .populate('fileId', 'plotNumber')
      .sort({ timestamp: -1 })

    res.status(200).json({ success: true, count: logs.length, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getAllUsers, toggleUserLock, getDashboardStats, getAuditLogs }
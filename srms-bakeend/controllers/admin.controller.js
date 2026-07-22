const User = require('../models/User.model')
const File = require('../models/File.model')
const PlotNumber = require('../models/PlotNumber.model')
const AuditLog = require('../models/AuditLog.model')
const bcrypt = require('bcryptjs')
const ResetRequest = require('../models/ResetRequest.model')

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

// Create a new user (admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, group, subRole, surveyorCode } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      })
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      ...(group && { group }),
      ...(subRole && { subRole }),
      ...(surveyorCode && { surveyorCode })
    })

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        group: user.group,
        subRole: user.subRole,
        surveyorCode: user.surveyorCode
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update a user's details (admin only)
const updateUser = async (req, res) => {
  try {
    const { name, email, role, group, subRole, surveyorCode } = req.body
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Prevent demoting the only admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change role of the only admin account'
        })
      }
    }

    if (name) user.name = name
    if (email) user.email = email
    if (role) user.role = role
    if (group !== undefined) user.group = group || undefined
    if (subRole !== undefined) user.subRole = subRole || undefined
    if (surveyorCode !== undefined) user.surveyorCode = surveyorCode || undefined

    await user.save()

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        group: user.group,
        subRole: user.subRole,
        surveyorCode: user.surveyorCode
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Delete a user (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the admin account'
      })
    }

    await user.deleteOne()

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Reset a user's password (admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      })
    }

    const salt = await bcrypt.genSalt(12)
    user.password = await bcrypt.hash(newPassword, salt)
    user.failedLoginAttempts = 0
    user.isLocked = false

    await user.save()

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.name}`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
// Get all pending password reset requests
const getResetRequests = async (req, res) => {
  try {
    const requests = await ResetRequest.find({ status: 'pending' })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Mark a reset request as resolved (call after using resetUserPassword)
const resolveResetRequest = async (req, res) => {
  try {
    const request = await ResetRequest.findById(req.params.id)
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' })
    }

    request.status = 'resolved'
    request.resolvedBy = req.user.id
    request.resolvedAt = new Date()
    await request.save()

    res.status(200).json({ success: true, message: 'Request marked as resolved' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
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
}
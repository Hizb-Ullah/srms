const User = require('../models/User.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const ResetRequest = require('../models/ResetRequest.model')

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
}

const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }
    const { name, email, password, role, group, subRole } = req.body
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created through registration'
      })
    }
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' })
    }
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    // group/subRole are optional — only used by the Lot Allocation feature
    const user = await User.create({ name, email, password: hashedPassword, role, group, subRole })
    const token = generateToken(user._id, user.role)
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, group: user.group, subRole: user.subRole }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }
    const { email, password, surveyorCode, userType } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' })
    }
    // Validate userType matches actual role
    const roleMap = {
      admin: ['admin', 'director'],
      dsm: ['surveyor', 'officer', 'approver'],
      officer: ['officer'],
      approver: ['approver'],
      surveyor: ['surveyor'],
      private: ['surveyor'],
      landboard: ['surveyor'],
    }
    if (userType && roleMap[userType] && !roleMap[userType].includes(user.role)) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' })
    }
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' })
    }
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account locked due to too many failed attempts. Contact admin.'
      })
    }
    // If user has a surveyorCode, it must be provided and must match
    if (user.surveyorCode) {
      if (!surveyorCode || String(surveyorCode).trim() !== String(user.surveyorCode).trim()) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' })
      }
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      user.failedLoginAttempts += 1
      if (user.failedLoginAttempts >= 5) user.isLocked = true
      await user.save()
      return res.status(400).json({ success: false, message: 'Invalid credentials' })
    }


    user.failedLoginAttempts = 0
    user.lastLogin = new Date()
    await user.save()
    const token = generateToken(user._id, user.role)
    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, group: user.group, subRole: user.subRole, surveyorCode: user.surveyorCode }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If this email exists in our system, a request has been submitted to the admin.'
      })
    }
    const existing = await ResetRequest.findOne({ email, status: 'pending' })
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'A reset request is already pending for this account.'
      })
    }
    await ResetRequest.create({ email, userId: user._id })
    res.status(200).json({
      success: true,
      message: 'Your request has been submitted. An administrator will reset your password shortly.'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const resetAdmin = async (req, res) => {
  try {
    const { secretKey } = req.body
    if (secretKey !== 'SRMS_RESET_2026') {
      return res.status(403).json({ success: false, message: 'Invalid secret key' })
    }
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash('Admin@123', salt)
    const result = await User.findOneAndUpdate(
      { role: { $in: ['admin', 'director'] } },
      { $set: { password: hashedPassword, isLocked: false, failedLoginAttempts: 0 } }
    )
    if (!result) {
      return res.status(404).json({ success: false, message: 'No admin account found' })
    }
    res.status(200).json({ success: true, message: 'Admin reset to default successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { register, login, getMe, requestPasswordReset, resetAdmin }
const jwt = require('jsonwebtoken')
const User = require('../models/User.model')

// Protect route - verify token
const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    next()

  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' })
  }
}

// Role guard
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized` 
      })
    }
    next()
  }
}

// Capability-based guard for the new DSM/Private/LandBoard group + sub-role
// RBAC (Lot Allocation feature). Kept separate from authorize() above so
// none of the existing role-based routes are affected.
const { hasCapability } = require('../config/permissions')

const authorizeCapability = (...capabilities) => {
  return (req, res, next) => {
    const ok = capabilities.some((cap) => hasCapability(req.user, cap))
    if (!ok) {
      return res.status(403).json({
        success: false,
        message: `Your role (${req.user.group || 'none'} / ${req.user.subRole || 'none'}) is not authorized for this action`
      })
    }
    next()
  }
}

module.exports = { protect, authorize, authorizeCapability }
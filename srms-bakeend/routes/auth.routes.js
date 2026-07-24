const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { register, login, getMe, requestPasswordReset, resetAdmin } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')

const registerValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter'),
  body('role')
    .isIn(['surveyor', 'officer', 'approver', 'admin'])
    .withMessage('Invalid role')
]

const loginValidation = [
  body('email')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
]

router.post('/register', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Self-registration is disabled. Contact your administrator to create an account.'
  })
})
router.post('/login', loginValidation, login)
router.get('/me', protect, getMe)
router.post('/forgot-password', requestPasswordReset)
router.post('/reset-admin', resetAdmin)

// Check if admin exists (for credentials page)
router.get('/admin-exists', async (req, res) => {
  try {
    const User = require('../models/User.model')
    const admin = await User.findOne({ role: 'admin' })
    res.status(200).json({ exists: !!admin })
  } catch (error) {
    res.status(500).json({ exists: false })
  }
})

module.exports = router
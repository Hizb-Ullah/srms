const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const { register, login, getMe, requestPasswordReset } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')

// Validation rules for register
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

// Validation rules for login
const loginValidation = [
  body('email')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
]

router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.get('/me', protect, getMe)
router.post('/forgot-password', requestPasswordReset)

module.exports = router
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: ['surveyor', 'officer', 'approver', 'admin', 'director'],
    default: 'surveyor'
  },
  // --- Lot Allocation feature: additive group/sub-role RBAC ---
  // Does not replace `role` above — existing controllers/routes keep using `role` untouched.
  group: {
    type: String,
    enum: ['DSM', 'Private', 'LandBoard']
  },
  subRole: {
    type: String,
    enum: [
      // DSM group
      'Director',
      'Files Controller',
      'Lot Allocator',
      'File Registration and Reservation',
      'File Capturing',
      'File Examination',
      'File Approval',
      // Private & Land Board groups
      'Registered Land Surveyor',
      'Assistant Surveyor'
    ]
  },
  // Surveyor's registered code (e.g. PS/001) — per Ted's diary "Surveyor Code #"
  surveyorCode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Account must be approved by Director before user can login
  isApproved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
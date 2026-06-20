const User = require('../models/User.model')
const bcrypt = require('bcryptjs')

const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' })

    if (existingAdmin) {
      console.log('Admin account already exists - skipping auto-create')
      return
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash('Admin@123', salt)

    await User.create({
      name: 'System Administrator',
      email: 'admin@dsm.gov.pk',
      password: hashedPassword,
      role: 'admin'
    })

    console.log('=============================')
    console.log('DEFAULT ADMIN CREATED')
    console.log('=============================')
    console.log('Email: admin@dsm.gov.pk')
    console.log('Password: Admin@123')
    console.log('=============================')
  } catch (error) {
    console.error('Error creating default admin:', error.message)
  }
}

module.exports = createDefaultAdmin
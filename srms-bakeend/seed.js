const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')

dotenv.config()

const User = require('./models/User.model')
const PlotNumber = require('./models/PlotNumber.model')
const File = require('./models/File.model')
const AuditLog = require('./models/AuditLog.model')

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected')

    // Clear existing data
    await User.deleteMany()
    await PlotNumber.deleteMany()
    await File.deleteMany()
    await AuditLog.deleteMany()
    console.log('Existing data cleared')

    // Hash password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash('Srms1234!', salt)

    // Create users
    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@dsm.gov.pk',
        password: hashedPassword,
        role: 'admin'
      },
      {
        name: 'DSM Officer',
        email: 'officer@dsm.gov.pk',
        password: hashedPassword,
        role: 'officer'
      },
      {
        name: 'DSM Approver',
        email: 'approver@dsm.gov.pk',
        password: hashedPassword,
        role: 'approver'
      },
      {
        name: 'Ahmed Khan',
        email: 'surveyor@dsm.gov.pk',
        password: hashedPassword,
        role: 'surveyor'
      }
    ])
    console.log('Users created')

    const surveyor = users.find(u => u.role === 'surveyor')
    const officer = users.find(u => u.role === 'officer')

    // Create plot numbers
    const plots = await PlotNumber.insertMany([
      {
        plotNumber: 'PLT-2026-00001',
        surveyRecordNumber: 'SRN-2026-00001',
        surveyorId: surveyor._id,
        isAssigned: true
      },
      {
        plotNumber: 'PLT-2026-00002',
        surveyRecordNumber: 'SRN-2026-00002',
        surveyorId: surveyor._id,
        isAssigned: true
      },
      {
        plotNumber: 'PLT-2026-00003',
        surveyRecordNumber: 'SRN-2026-00003',
        surveyorId: surveyor._id,
        isAssigned: true
      }
    ])
    console.log('Plot numbers created')

    // Create sample files
    await File.insertMany([
      {
        plotNumber: 'PLT-2026-00001',
        surveyRecordNumber: 'SRN-2026-00001',
        surveyorId: surveyor._id,
        status: 'capturing',
        currentStage: 'capturing',
        stages: [
          { name: 'capturing',   status: 'pending' },
          { name: 'examination', status: 'pending' },
          { name: 'approval',    status: 'pending' },
          { name: 'dispatch',    status: 'pending' }
        ],
        documents: []
      },
      {
        plotNumber: 'PLT-2026-00002',
        surveyRecordNumber: 'SRN-2026-00002',
        surveyorId: surveyor._id,
        status: 'rework',
        currentStage: 'rework',
        stages: [
          { name: 'capturing',   status: 'failed', processedBy: officer._id, remarks: 'Documents incomplete', timestamp: new Date() },
          { name: 'examination', status: 'pending' },
          { name: 'approval',    status: 'pending' },
          { name: 'dispatch',    status: 'pending' }
        ],
        documents: []
      },
      {
        plotNumber: 'PLT-2026-00003',
        surveyRecordNumber: 'SRN-2026-00003',
        surveyorId: surveyor._id,
        status: 'submitted',
        currentStage: 'submitted',
        stages: [
          { name: 'capturing',   status: 'pending' },
          { name: 'examination', status: 'pending' },
          { name: 'approval',    status: 'pending' },
          { name: 'dispatch',    status: 'pending' }
        ],
        documents: []
      }
    ])
    console.log('Sample files created')

    console.log('\n=============================')
    console.log('SEED COMPLETED SUCCESSFULLY')
    console.log('=============================')
    console.log('\nTest Accounts:')
    console.log('Admin    → admin@dsm.gov.pk    / Srms1234!')
    console.log('Officer  → officer@dsm.gov.pk  / Srms1234!')
    console.log('Approver → approver@dsm.gov.pk / Srms1234!')
    console.log('Surveyor → surveyor@dsm.gov.pk / Srms1234!')
    console.log('\nAll accounts use password: Srms1234!')
    console.log('=============================\n')

    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error.message)
    process.exit(1)
  }
}

seedData()
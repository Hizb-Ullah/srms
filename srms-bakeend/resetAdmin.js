require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

async function resetAdmin() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash('Admin@123', salt)

  const result = await mongoose.connection.collection('users').updateOne(
    { role: 'admin' },
    {
      $set: {
        password: hashedPassword,
        isLocked: false,
        failedLoginAttempts: 0
      }
    }
  )

  console.log('Admin reset result:', result.modifiedCount === 1 ? 'SUCCESS' : 'NOT FOUND')
  await mongoose.disconnect()
  process.exit(0)
}

resetAdmin().catch(console.error)
const mongoose = require('mongoose')
const dns = require('dns')

// Force IPv4 DNS resolution - fixes intermittent SRV lookup failures on some ISPs
dns.setDefaultResultOrder('ipv4first')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      family: 4
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`)
    console.log('Running without database connection...')
  }
}

module.exports = connectDB
const nodemailer = require('nodemailer')

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Send status update email
const sendStatusEmail = async ({ to, name, plotNumber, status, remarks }) => {
  try {
    const statusMessages = {
      submitted:   'Your file has been submitted successfully.',
      capturing:   'Your file is currently being captured by DSM.',
      examination: 'Your file is under examination.',
      approval:    'Your file is pending approval.',
      dispatch:    'Your file has been approved and is being dispatched.',
      archived:    'Your file has been archived successfully.',
      rework:      'Your file requires corrections and has been returned to you.'
    }

    const message = statusMessages[status] || 'Your file status has been updated.'

    const mailOptions = {
      from: `"SRMS - Department of Surveys & Mapping" <${process.env.EMAIL_USER}>`,
      to,
      subject: `SRMS — File Status Update: ${plotNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a3c5e; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Department of Surveys & Mapping</h1>
            <p style="color: #ccc; margin: 5px 0;">Survey Record Management System</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>${message}</p>
            
            <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px; color: #1a3c5e;">File Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Plot Number</td>
                  <td style="padding: 8px 0; font-weight: bold;">${plotNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Current Status</td>
                  <td style="padding: 8px 0; font-weight: bold; text-transform: uppercase; color: #1a3c5e;">${status}</td>
                </tr>
                ${remarks ? `
                <tr>
                  <td style="padding: 8px 0; color: #666;">Remarks</td>
                  <td style="padding: 8px 0;">${remarks}</td>
                </tr>` : ''}
              </table>
            </div>

            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact DSM directly.
            </p>
          </div>

          <div style="background: #1a3c5e; padding: 15px; text-align: center;">
            <p style="color: #ccc; margin: 0; font-size: 12px;">
              This is an automated message from SRMS. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent to ${to}`)
  } catch (error) {
    console.error('Email error:', error.message)
  }
}

module.exports = { sendStatusEmail }
const LotAllocationRequest = require('../models/LotAllocationRequest.model')
const User = require('../models/User.model')
const logAction = require('../utils/auditLogger')
const {
  generatePlotNumbersForVillage,
  generateSurveyRecordNumbers,
  generateDsmNumbers,
  generateOsNumbers
} = require('../utils/lotNumberGenerator')
const {
  sendLotAllocatorNotificationEmail,
  sendAccountsOfficeEmail
} = require('../utils/emailService')

// Client confirmed: multiple-plot requests max out at 5
const MULTIPLE_PLOT_MAX = parseInt(process.env.MULTIPLE_PLOT_MAX || '5', 10)

// Step 1-2: Surveyor (Private / Land Board) submits a lot number request —
// plot numbers, SR#, DSM#, OS# are all auto-assigned here.
const createLotRequest = async (req, res) => {
  try {
    const { village, requestType, parentPlotNumber, landBoard, cadastreNumber } = req.body

    if (!village || !requestType) {
      return res.status(400).json({ success: false, message: 'Village and request type are required' })
    }

    if (!['single_plot', 'multiple_plot', 'subdivision'].includes(requestType)) {
      return res.status(400).json({ success: false, message: 'Invalid request type' })
    }

    let plotCount

    if (requestType === 'single_plot') {
      plotCount = 1
    } else if (requestType === 'multiple_plot') {
      plotCount = parseInt(req.body.plotCount, 10)
      if (!plotCount || plotCount < 2 || plotCount > MULTIPLE_PLOT_MAX) {
        return res.status(400).json({
          success: false,
          message: `Multiple plot requests must be between 2 and ${MULTIPLE_PLOT_MAX} plots`
        })
      }
    } else {
      // subdivision
      plotCount = parseInt(req.body.plotCount, 10)
      if (!plotCount || plotCount < 1) {
        return res.status(400).json({ success: false, message: 'Subdivision plot count is required' })
      }
      if (!parentPlotNumber) {
        return res.status(400).json({ success: false, message: 'Parent plot number is required for a subdivision request' })
      }
    }

    // Auto-assign plot numbers (village-scoped sequence), plus SR#, DSM#, OS#
    // for each individual plot — DSM# and OS# are always generated per-plot,
    // never shared/inherited, per client confirmation.
    const plotNumbers = await generatePlotNumbersForVillage(village, plotCount)
    const srNumbers = await generateSurveyRecordNumbers(plotCount)
    const dsmNumbers = await generateDsmNumbers(plotCount)
    const osNumbers = await generateOsNumbers(plotCount)

    const plots = plotNumbers.map((plotNumber, i) => ({
      plotNumber,
      surveyRecordNumber: srNumbers[i],
      dsmNumber: dsmNumbers[i],
      osNumber: osNumbers[i],
      cadastreNumber: cadastreNumber || ''
    }))

    const requestData = {
      requestedBy: req.user.id,
      group: req.user.group,
      village,
      landBoard: landBoard || '',
      requestType,
      surveyorCode: req.user.surveyorCode || '',
      plots,
      status: 'pending_allocator_review'
    }

    if (requestType === 'subdivision') {
      requestData.parentPlotNumber = parentPlotNumber
      requestData.subdivisionRange = {
        from: plotNumbers[0],
        to: plotNumbers[plotNumbers.length - 1]
      }
    }

    const lotRequest = await LotAllocationRequest.create(requestData)

    await logAction({
      action: `Lot allocation request submitted (${requestType}) for village ${village}`,
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Plot number(s): ${plotNumbers.join(', ')}`
    })

    // Step 3: Notify the Lot Allocator (in-app + email — client confirmed both)
    const allocators = await User.find({
      group: 'DSM',
      subRole: { $in: ['Lot Allocator', 'Files Controller', 'Director'] }
    })

    allocators.forEach((allocator) => {
      if (global.io) {
        global.io.to(allocator._id.toString()).emit('lotRequestSubmitted', {
          requestId: lotRequest._id,
          village,
          requestType,
          plotNumbers,
          message: `New lot allocation request for ${village} awaiting review`
        })
      }
    })

    await Promise.all(
      allocators.map((allocator) =>
        sendLotAllocatorNotificationEmail({
          to: allocator.email,
          name: allocator.name,
          village,
          requestType,
          plotNumbers
        })
      )
    )

    res.status(201).json({
      success: true,
      message: 'Lot allocation request submitted successfully',
      data: lotRequest
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Lot Allocator's initial review — opens payment (Step 4 begins)
const reviewRequest = async (req, res) => {
  try {
    const request = await LotAllocationRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.status !== 'pending_allocator_review') {
      return res.status(400).json({
        success: false,
        message: `Request is at status ${request.status}, cannot review`
      })
    }

    request.status = 'awaiting_payment'
    request.reviewedBy = req.user.id
    request.reviewedAt = new Date()
    await request.save()

    await logAction({
      action: 'Lot Allocator reviewed request — payment opened',
      performedBy: req.user.id,
      role: req.user.subRole,
      remarks: `Request ${request._id} moved to awaiting_payment`
    })

    if (global.io) {
      global.io.to(request.requestedBy.toString()).emit('lotRequestUpdate', {
        requestId: request._id,
        status: 'awaiting_payment',
        message: 'Your lot allocation request has been reviewed. Please proceed with payment and upload your Proof of Payment (POP).'
      })
    }

    res.status(200).json({ success: true, message: 'Request reviewed — payment opened', data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Step 5: Surveyor uploads Proof of Payment (POP) — payment itself is purely
// offline (client confirmed), this is the only payment-related surveyor action.
const uploadPop = async (req, res) => {
  try {
    const request = await LotAllocationRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to upload POP for this request' })
    }

    if (request.status !== 'awaiting_payment') {
      return res.status(400).json({
        success: false,
        message: `Request is at status ${request.status}, cannot upload POP`
      })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'POP document is required' })
    }

    request.popDocumentUrl = req.file.path
    request.status = 'pop_uploaded'
    await request.save()

    await logAction({
      action: 'Surveyor uploaded Proof of Payment (POP)',
      performedBy: req.user.id,
      role: req.user.subRole,
      remarks: `Request ${request._id}`
    })

    if (global.io && request.reviewedBy) {
      global.io.to(request.reviewedBy.toString()).emit('lotRequestUpdate', {
        requestId: request._id,
        status: 'pop_uploaded',
        message: 'Proof of Payment uploaded — awaiting manual payment confirmation'
      })
    }

    res.status(200).json({ success: true, message: 'POP uploaded successfully', data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Payment is purely offline — Lot Allocator (or Files Controller/Director)
// manually marks it as received after checking the uploaded POP.
const markPaymentReceived = async (req, res) => {
  try {
    const request = await LotAllocationRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.status !== 'pop_uploaded') {
      return res.status(400).json({
        success: false,
        message: `Request is at status ${request.status}, cannot mark payment received`
      })
    }

    request.status = 'payment_confirmed'
    request.paymentMarkedBy = req.user.id
    request.paymentMarkedAt = new Date()
    await request.save()

    await logAction({
      action: 'Payment manually confirmed by Lot Allocator',
      performedBy: req.user.id,
      role: req.user.subRole,
      remarks: `Request ${request._id}`
    })

    if (global.io) {
      global.io.to(request.requestedBy.toString()).emit('lotRequestUpdate', {
        requestId: request._id,
        status: 'payment_confirmed',
        message: 'Your payment has been confirmed. Final approval is pending.'
      })
    }

    res.status(200).json({ success: true, message: 'Payment marked as received', data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Step 6-7: Final approval — only allowed after payment is confirmed.
// Automatically emails the Accounts office with POP attached.
const approveRequest = async (req, res) => {
  try {
    const request = await LotAllocationRequest.findById(req.params.id).populate('requestedBy', 'name email')
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (request.status !== 'payment_confirmed') {
      return res.status(400).json({
        success: false,
        message: `Request must have payment confirmed before final approval (current status: ${request.status})`
      })
    }

    request.status = 'approved'
    request.approvedBy = req.user.id
    request.approvedAt = new Date()
    await request.save()

    await logAction({
      action: 'Lot allocation request given final approval',
      performedBy: req.user.id,
      role: req.user.subRole,
      remarks: `Request ${request._id} approved`
    })

    await sendAccountsOfficeEmail({ request })
    request.accountsEmailSentAt = new Date()
    await request.save()

    if (global.io) {
      global.io.to(request.requestedBy._id.toString()).emit('lotRequestUpdate', {
        requestId: request._id,
        status: 'approved',
        message: 'Your lot allocation request has been approved.'
      })
    }

    res.status(200).json({ success: true, message: 'Request approved and Accounts office notified', data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Reject a request at any pending stage
const rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const request = await LotAllocationRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })

    if (['approved', 'rejected'].includes(request.status)) {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` })
    }

    request.status = 'rejected'
    request.rejectedBy = req.user.id
    request.rejectionReason = reason
    await request.save()

    await logAction({
      action: 'Lot allocation request rejected',
      performedBy: req.user.id,
      role: req.user.subRole,
      remarks: reason
    })

    if (global.io) {
      global.io.to(request.requestedBy.toString()).emit('lotRequestUpdate', {
        requestId: request._id,
        status: 'rejected',
        message: `Your lot allocation request was rejected. Reason: ${reason}`
      })
    }

    res.status(200).json({ success: true, message: 'Request rejected', data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Surveyor — view own requests
const getMyRequests = async (req, res) => {
  try {
    const requests = await LotAllocationRequest.find({ requestedBy: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// DSM staff — view all requests
const getAllRequests = async (req, res) => {
  try {
    const requests = await LotAllocationRequest.find()
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Internal helper — last allocated plot number for a village
const getLastPlotNumber = async (req, res) => {
  try {
    const { village } = req.params
    const latest = await LotAllocationRequest.findOne({ village }).sort({ createdAt: -1 })
    const lastPlot = latest && latest.plots.length ? latest.plots[latest.plots.length - 1].plotNumber : null
    res.status(200).json({ success: true, village, lastPlotNumber: lastPlot })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  createLotRequest,
  reviewRequest,
  uploadPop,
  markPaymentReceived,
  approveRequest,
  rejectRequest,
  getMyRequests,
  getAllRequests,
  getLastPlotNumber
}

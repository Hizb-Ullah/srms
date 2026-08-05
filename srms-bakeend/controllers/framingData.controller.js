const FramingDataRequest = require('../models/FramingDataRequest.model')
const User = require('../models/User.model')
const logAction = require('../utils/auditLogger')
const { getFileUrl } = require('../utils/fileUrl')

// ---------------------------------------------------------------------------
// Request Framing Data — per client, follows the same route as Shape File
// Scratch: the surveyor enters the Lot Number + Village they want framing
// data for. It goes directly to the File Controller (not RMU). Flow:
//   Received from Surveyor (with Controller)
//     -> Sent to Capturing (Controller's action)
//       -> Capturing officer marks Passed/Failed + optionally uploads a report
//     -> Forwarded to Surveyor (result visible to Controller AND surveyor)
// ---------------------------------------------------------------------------

const notifyUser = (userId, message) => {
  if (global.io) global.io.to(userId.toString()).emit('lotRequestUpdate', { message })
}

// Step 1 — Surveyor submits a framing data request. Goes directly to the
// File Controller.
const submitFramingDataRequest = async (req, res) => {
  try {
    const { lotNumber, village } = req.body
    if (!lotNumber || !lotNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Lot Number is required' })
    }
    if (!village || !village.trim()) {
      return res.status(400).json({ success: false, message: 'Village is required' })
    }

    const request = await FramingDataRequest.create({
      requestedBy: req.user.id,
      lotNumber: lotNumber.trim(),
      village: village.trim()
    })

    await logAction({
      action: 'Surveyor requested framing data',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Lot ${lotNumber.trim()}, ${village.trim()}`
    })

    // Goes directly to the File Controller (Files Controller / Director)
    const controllers = await User.find({ group: 'DSM', subRole: { $in: ['Files Controller', 'Director'] } })
    controllers.forEach((c) => notifyUser(c._id, 'New framing data request awaiting review'))

    res.status(201).json({ success: true, message: 'Framing data request submitted', data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Surveyor — view own framing data requests
const getMyFramingDataRequests = async (req, res) => {
  try {
    const requests = await FramingDataRequest.find({ requestedBy: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Controller — all framing data requests
const getControllerFramingDataRequests = async (req, res) => {
  try {
    const requests = await FramingDataRequest.find()
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Controller — send a received request to Capturing
const sendFramingDataToCapturing = async (req, res) => {
  try {
    const request = await FramingDataRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ success: false, message: 'Framing data request not found' })
    if (request.status !== 'received_from_surveyor') {
      return res.status(400).json({ success: false, message: `Cannot send to Capturing from status "${request.status}"` })
    }

    request.status = 'sent_to_capturing'
    request.sentToCapturingBy = req.user.id
    request.sentToCapturingAt = new Date()
    await request.save()

    await logAction({
      action: 'File Controller sent framing data request to Capturing',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Request ${request._id} (Lot ${request.lotNumber}, ${request.village})`
    })

    res.status(200).json({ success: true, message: 'Sent to Capturing', data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Capturing — queue of framing data requests sent to them, not yet reviewed
const getCapturingFramingDataQueue = async (req, res) => {
  try {
    const requests = await FramingDataRequest.find({ status: 'sent_to_capturing', capturingOutcome: null })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ sentToCapturingAt: -1 })
    res.status(200).json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Capturing — completed framing data reviews (for reference)
const getCapturingFramingDataCompleted = async (req, res) => {
  try {
    const requests = await FramingDataRequest.find({ status: 'forwarded_to_surveyor' })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ reviewedAt: -1 })
    res.status(200).json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Capturing — mark Passed/Failed with an optionally uploaded report.
// Result goes back to the Controller and is automatically visible to the surveyor.
const reviewFramingDataCapturing = async (req, res) => {
  try {
    const { outcome } = req.body
    if (!['passed', 'failed'].includes(outcome)) {
      return res.status(400).json({ success: false, message: "Outcome must be 'passed' or 'failed'" })
    }

    const request = await FramingDataRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ success: false, message: 'Framing data request not found' })
    if (request.status !== 'sent_to_capturing') {
      return res.status(400).json({ success: false, message: 'Framing data request is not with Capturing' })
    }

    request.capturingOutcome = outcome
    if (req.file) {
      request.reportUrl = getFileUrl(req, req.file.filename)
      request.reportFileName = req.file.originalname
    }
    request.status = 'forwarded_to_surveyor'
    request.reviewedBy = req.user.id
    request.reviewedAt = new Date()
    await request.save()

    await logAction({
      action: `File Capturing reviewed framing data request (${outcome})`,
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Request ${request._id} (Lot ${request.lotNumber}, ${request.village})`
    })

    // Automatically goes to the surveyor, and stays visible to the Controller
    notifyUser(request.requestedBy, `Your framing data request result: ${outcome}`)
    const controllers = await User.find({ group: 'DSM', subRole: { $in: ['Files Controller', 'Director'] } })
    controllers.forEach((c) => notifyUser(c._id, `Framing data request ${outcome} by Capturing — forwarded to surveyor`))

    res.status(200).json({ success: true, message: `Marked as ${outcome} and forwarded to surveyor`, data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  submitFramingDataRequest,
  getMyFramingDataRequests,
  getControllerFramingDataRequests,
  sendFramingDataToCapturing,
  getCapturingFramingDataQueue,
  getCapturingFramingDataCompleted,
  reviewFramingDataCapturing
}

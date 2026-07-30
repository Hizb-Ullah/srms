const ShapeFileScratch = require('../models/ShapeFileScratch.model')
const User = require('../models/User.model')
const logAction = require('../utils/auditLogger')
const { getFileUrl } = require('../utils/fileUrl')

// ---------------------------------------------------------------------------
// Shape File Scratch — a data consistency pre-check. Before submitting a
// full layout, a surveyor sends a surveyed shape file straight to the File
// Controller (not via RMU) to run a "Scratch" against an existing Parent
// plot or General Plan record. Flow:
//   Received from Surveyor (with Controller)
//     -> Sent to Capturing (Controller's action)
//       -> Capturing officer marks Passed/Failed + uploads a report
//     -> Forwarded to Surveyor (result visible to Controller AND surveyor)
// ---------------------------------------------------------------------------

const notifyUser = (userId, message) => {
  if (global.io) global.io.to(userId.toString()).emit('lotRequestUpdate', { message })
}

// Step 1 — Surveyor submits a shape file, referencing an existing Parent
// plot or General Plan by SR#/DSM#. Goes directly to the File Controller.
const submitScratch = async (req, res) => {
  try {
    const { linkType, referenceSrNumber, referenceDsmNumber } = req.body
    if (!['parent', 'general_plan'].includes(linkType)) {
      return res.status(400).json({ success: false, message: "linkType must be 'parent' or 'general_plan'" })
    }
    if (!referenceSrNumber || !referenceDsmNumber) {
      return res.status(400).json({ success: false, message: 'Reference SR# and DSM# are required' })
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'A shape file is required' })
    }

    const scratch = await ShapeFileScratch.create({
      requestedBy: req.user.id,
      linkType,
      referenceSrNumber,
      referenceDsmNumber,
      fileUrl: getFileUrl(req, req.file.filename),
      fileName: req.file.originalname
    })

    await logAction({
      action: 'Surveyor submitted a shape file for scratch check',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Scratch ${scratch._id} (${req.file.originalname}) — ${linkType} SR# ${referenceSrNumber} / DSM# ${referenceDsmNumber}`
    })

    // Goes directly to the File Controller (Files Controller / Director)
    const controllers = await User.find({ group: 'DSM', subRole: { $in: ['Files Controller', 'Director'] } })
    controllers.forEach((c) => notifyUser(c._id, `New shape file scratch request awaiting review`))

    res.status(201).json({ success: true, message: 'Shape file submitted for scratch check', data: scratch })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Surveyor — view own scratch requests
const getMyScratchRequests = async (req, res) => {
  try {
    const records = await ShapeFileScratch.find({ requestedBy: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Controller — all scratch requests
const getControllerScratchRequests = async (req, res) => {
  try {
    const records = await ShapeFileScratch.find()
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Controller — send a received scratch request to Capturing
const sendScratchToCapturing = async (req, res) => {
  try {
    const record = await ShapeFileScratch.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Scratch request not found' })
    if (record.status !== 'received_from_surveyor') {
      return res.status(400).json({ success: false, message: `Cannot send to Capturing from status "${record.status}"` })
    }

    record.status = 'sent_to_capturing'
    record.sentToCapturingBy = req.user.id
    record.sentToCapturingAt = new Date()
    await record.save()

    await logAction({
      action: 'File Controller sent scratch request to Capturing',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Scratch ${record._id} (${record.fileName})`
    })

    res.status(200).json({ success: true, message: 'Sent to Capturing', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Capturing — queue of scratch requests sent to them, not yet reviewed
const getCapturingScratchQueue = async (req, res) => {
  try {
    const records = await ShapeFileScratch.find({ status: 'sent_to_capturing', capturingOutcome: null })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ sentToCapturingAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Capturing — completed scratch reviews (for reference)
const getCapturingScratchCompleted = async (req, res) => {
  try {
    const records = await ShapeFileScratch.find({ status: 'forwarded_to_surveyor' })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ reviewedAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// File Capturing — mark Passed/Failed with an uploaded report. Result goes
// back to the Controller and is automatically visible to the surveyor.
const reviewScratchCapturing = async (req, res) => {
  try {
    const { outcome } = req.body
    if (!['passed', 'failed'].includes(outcome)) {
      return res.status(400).json({ success: false, message: "Outcome must be 'passed' or 'failed'" })
    }

    const record = await ShapeFileScratch.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Scratch request not found' })
    if (record.status !== 'sent_to_capturing') {
      return res.status(400).json({ success: false, message: 'Scratch request is not with Capturing' })
    }

    record.capturingOutcome = outcome
    if (req.file) {
      record.reportUrl = getFileUrl(req, req.file.filename)
      record.reportFileName = req.file.originalname
    }
    record.status = 'forwarded_to_surveyor'
    record.reviewedBy = req.user.id
    record.reviewedAt = new Date()
    await record.save()

    await logAction({
      action: `File Capturing reviewed scratch request (${outcome})`,
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Scratch ${record._id} (${record.fileName})`
    })

    // Automatically goes to the surveyor, and stays visible to the Controller
    notifyUser(record.requestedBy, `Your shape file scratch check result: ${outcome}`)
    const controllers = await User.find({ group: 'DSM', subRole: { $in: ['Files Controller', 'Director'] } })
    controllers.forEach((c) => notifyUser(c._id, `Scratch request ${outcome} by Capturing — forwarded to surveyor`))

    res.status(200).json({ success: true, message: `Marked as ${outcome} and forwarded to surveyor`, data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  submitScratch,
  getMyScratchRequests,
  getControllerScratchRequests,
  sendScratchToCapturing,
  getCapturingScratchQueue,
  getCapturingScratchCompleted,
  reviewScratchCapturing
}

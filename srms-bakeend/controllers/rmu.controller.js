const LotAllocationRequest = require('../models/LotAllocationRequest.model')
const RmuComment = require('../models/RmuComment.model')
const User = require('../models/User.model')
const logAction = require('../utils/auditLogger')

// ---------------------------------------------------------------------------
// RMU (Records Management Unit / Office)
//
// Surveyors physically submit their records to the RMU. The RMU:
//   1. Looks the record up by SR#, DSM#, or Lot/Plot Number (already created
//      through the Lot Allocator) and records it as received.
//   2. Enters the payment receipt / invoice number attached to the file —
//      after this the Lot Allocator's Active Requests show it as "Paid".
//   3. Submits the record to the Controller.
//   4. Receives it back from the Controller (approved / not approved).
//   5. Shows all pending-collection files and marks them collected when the
//      surveyor picks them up.
// ---------------------------------------------------------------------------

// Search an existing lot-allocation record by SR#, DSM#, or Lot/Plot Number.
// The system picks up records already added through the Lot Allocator.
const searchRecord = async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required (SR#, DSM#, or Lot Number)' })
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(escaped, 'i')

    const records = await LotAllocationRequest.find({
      $or: [
        { 'plots.surveyRecordNumber': rx },
        { 'plots.dsmNumber': rx },
        { 'plots.plotNumber': rx }
      ]
    })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ createdAt: -1 })
      .limit(20)

    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// All records the RMU has touched (any rmuStatus set)
const getRmuRecords = async (req, res) => {
  try {
    const records = await LotAllocationRequest.find({ rmuStatus: { $ne: null } })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ updatedAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Step 1 — RMU records a physically-received file from a surveyor
const receiveRecord = async (req, res) => {
  try {
    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    if (record.rmuStatus) {
      return res.status(400).json({ success: false, message: `Record already in RMU workflow (status: ${record.rmuStatus})` })
    }

    record.rmuStatus = 'received_from_surveyor'
    record.rmuReceivedBy = req.user.id
    record.rmuReceivedAt = new Date()
    if (req.body.notes) record.rmuNotes = req.body.notes
    await record.save()

    await logAction({
      action: 'RMU recorded a physically-received file from surveyor',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village})`
    })

    res.status(200).json({ success: true, message: 'Record marked as received from surveyor', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Payment receipt / invoice number — attached by the surveyor to the physical
// file; RMU enters it here. Lot Allocator's Active Requests then show "Paid".
const enterReceiptNumber = async (req, res) => {
  try {
    const { receiptNumber } = req.body
    if (!receiptNumber || !receiptNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Receipt / invoice number is required' })
    }

    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    record.paymentReceiptNumber = receiptNumber.trim()
    record.receiptEnteredBy = req.user.id
    record.receiptEnteredAt = new Date()
    await record.save()

    await logAction({
      action: 'RMU entered payment receipt / invoice number',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} — receipt ${receiptNumber.trim()}`
    })

    // Notify Lot Allocator side (request now shows as Paid)
    if (global.io && record.reviewedBy) {
      global.io.to(record.reviewedBy.toString()).emit('lotRequestUpdate', {
        requestId: record._id,
        message: `Payment receipt ${receiptNumber.trim()} recorded by RMU — request marked as Paid`
      })
    }

    res.status(200).json({ success: true, message: 'Receipt number recorded — request now shows as Paid', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Step 2 — RMU submits the record to the Controller
const submitToController = async (req, res) => {
  try {
    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    if (record.rmuStatus !== 'received_from_surveyor') {
      return res.status(400).json({
        success: false,
        message: `Record must be received from surveyor first (current RMU status: ${record.rmuStatus || 'none'})`
      })
    }

    // Payment receipt rule: Private surveyor records CANNOT pass the RMU
    // stage without a receipt number. For Land Board surveyors payment is
    // optional, so their records may proceed without one.
    if (record.group === 'Private' && !record.paymentReceiptNumber) {
      return res.status(400).json({
        success: false,
        message: 'Private surveyor records cannot be submitted to the Controller without a payment receipt number. Please enter the receipt number first.'
      })
    }

    record.rmuStatus = 'submitted_to_controller'
    record.rmuSubmittedToControllerAt = new Date()
    // File lands on the Controller's desk: received but not yet assigned
    record.controllerStage = 'received_unassigned'
    record.controllerStageUpdatedAt = new Date()
    record.controllerHistory.push({ stage: 'received_unassigned', by: req.user.id, at: new Date() })
    await record.save()

    await logAction({
      action: 'RMU submitted record to Controller',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village})`
    })

    res.status(200).json({ success: true, message: 'Record submitted to Controller', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Step 3 — record received back from the Controller (approved / not approved)
const receiveBackFromController = async (req, res) => {
  try {
    const { outcome } = req.body
    if (!['approved', 'not_approved'].includes(outcome)) {
      return res.status(400).json({ success: false, message: "Outcome must be 'approved' or 'not_approved'" })
    }

    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    if (record.rmuStatus !== 'submitted_to_controller') {
      return res.status(400).json({
        success: false,
        message: `Record must be with Controller first (current RMU status: ${record.rmuStatus || 'none'})`
      })
    }

    record.rmuStatus = 'returned_from_controller'
    record.rmuOutcome = outcome
    record.rmuReturnedAt = new Date()
    // Keep Controller workflow stage consistent
    if (record.controllerStage && record.controllerStage !== 'returned_to_rmu') {
      record.controllerStage = 'returned_to_rmu'
      record.controllerStageUpdatedAt = new Date()
      record.controllerHistory.push({ stage: 'returned_to_rmu', by: req.user.id, at: new Date() })
    }
    await record.save()

    await logAction({
      action: `Record returned from Controller (${outcome.replace('_', ' ')})`,
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village})`
    })

    // Notify surveyor their file is ready for collection
    if (global.io) {
      global.io.to(record.requestedBy.toString()).emit('lotRequestUpdate', {
        requestId: record._id,
        message: `Your file for ${record.village} is ready for collection at the RMU (${outcome.replace('_', ' ')})`
      })
    }

    res.status(200).json({ success: true, message: 'Record received back from Controller — pending collection', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Pending collection — files returned from the Controller but not yet
// collected by the surveyor
const getPendingCollections = async (req, res) => {
  try {
    const records = await LotAllocationRequest.find({ rmuStatus: 'returned_from_controller' })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ rmuReturnedAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Final step — surveyor collects the physical file
const markCollected = async (req, res) => {
  try {
    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    if (record.rmuStatus !== 'returned_from_controller') {
      return res.status(400).json({
        success: false,
        message: `Record is not pending collection (current RMU status: ${record.rmuStatus || 'none'})`
      })
    }

    record.rmuStatus = 'collected'
    record.rmuCollectedAt = new Date()
    await record.save()

    await logAction({
      action: 'RMU marked file as collected by surveyor',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village})`
    })

    res.status(200).json({ success: true, message: 'File marked as collected', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Send Surveyor Comment — RMU sends a comment/notification to the surveyor
// about their file (per client's RMU dashboard schema).
const sendSurveyorComment = async (req, res) => {
  try {
    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Comment message is required' })
    }

    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    record.rmuComments.push({ message: message.trim(), sentBy: req.user.id, sentAt: new Date() })
    await record.save()

    await logAction({
      action: 'RMU sent comment to surveyor',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village}) — ${message.trim()}`
    })

    if (global.io) {
      global.io.to(record.requestedBy.toString()).emit('lotRequestUpdate', {
        requestId: record._id,
        message: `RMU comment on your ${record.village} file: ${message.trim()}`
      })
    }

    res.status(200).json({ success: true, message: 'Comment sent to surveyor', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Standalone Send Surveyor Comment — officer can message any surveyor
// directly (e.g. when unable to load their file on New Arrivals), identified
// by surveyor code or email.
const sendStandaloneComment = async (req, res) => {
  try {
    const { surveyorIdentifier, message } = req.body
    if (!surveyorIdentifier || !surveyorIdentifier.trim()) {
      return res.status(400).json({ success: false, message: 'Surveyor code or email is required' })
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Comment message is required' })
    }

    const idf = surveyorIdentifier.trim()
    const surveyor = await User.findOne({
      group: { $in: ['Private', 'LandBoard'] },
      $or: [
        { surveyorCode: new RegExp(`^${idf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { email: idf.toLowerCase() }
      ]
    })
    if (!surveyor) {
      return res.status(404).json({ success: false, message: 'No surveyor found with that code or email' })
    }

    const comment = await RmuComment.create({
      surveyor: surveyor._id,
      message: message.trim(),
      sentBy: req.user.id
    })

    await logAction({
      action: 'RMU sent standalone comment to surveyor',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `To ${surveyor.name} (${surveyor.surveyorCode || surveyor.email}) — ${message.trim()}`
    })

    if (global.io) {
      global.io.to(surveyor._id.toString()).emit('lotRequestUpdate', {
        message: `Message from RMU: ${message.trim()}`
      })
    }

    res.status(201).json({ success: true, message: `Comment sent to ${surveyor.name}`, data: comment })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// List of standalone comments the RMU has sent
const getStandaloneComments = async (req, res) => {
  try {
    const comments = await RmuComment.find()
      .populate('surveyor', 'name email surveyorCode')
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
    res.status(200).json({ success: true, count: comments.length, data: comments })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Storage — after a file is dispatched, the officer sends it to storage.
const sendToStorage = async (req, res) => {
  try {
    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    if (record.rmuStatus !== 'collected') {
      return res.status(400).json({
        success: false,
        message: `Only dispatched files can be sent to storage (current RMU status: ${record.rmuStatus || 'none'})`
      })
    }

    record.rmuStatus = 'in_storage'
    record.rmuStorageAt = new Date()
    await record.save()

    await logAction({
      action: 'RMU sent file to storage',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village})`
    })

    res.status(200).json({ success: true, message: 'File sent to storage', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  sendToStorage,
  sendStandaloneComment,
  getStandaloneComments,
  sendSurveyorComment,
  searchRecord,
  getRmuRecords,
  receiveRecord,
  enterReceiptNumber,
  submitToController,
  receiveBackFromController,
  getPendingCollections,
  markCollected
}

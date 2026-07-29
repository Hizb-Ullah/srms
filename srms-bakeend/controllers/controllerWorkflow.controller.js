const LotAllocationRequest = require('../models/LotAllocationRequest.model')
const logAction = require('../utils/auditLogger')

// ---------------------------------------------------------------------------
// Controller workflow (per client's Controller dashboard schema)
//
// Files arrive from the RMU ("received but not yet assigned") and the
// Controller moves them through the DSM sections with a send/receive pair at
// each stage:
//   Registration & Reservation → Capturing → Examination → Approval
// At every "received back" action point the Controller can either send the
// file to the next section or return it to the RMU.
// ---------------------------------------------------------------------------

// Valid transitions: currentStage → allowed next stages
const TRANSITIONS = {
  received_unassigned:        ['sent_to_registration'],
  sent_to_registration:       ['received_from_registration'],
  received_from_registration: ['sent_to_capturing'],
  sent_to_capturing:          ['received_from_capturing'],
  received_from_capturing:    ['sent_to_examination'],
  sent_to_examination:        ['received_from_examination'],
  received_from_examination:  ['sent_to_approval'],
  sent_to_approval:           ['received_from_approval'],
  received_from_approval:     []
}

// Stages at which the Controller may return the file to the RMU
const RETURNABLE_STAGES = [
  'received_unassigned',
  'received_from_registration',
  'received_from_capturing',
  'received_from_examination',
  'received_from_approval'
]

const STAGE_LABELS = {
  received_unassigned: 'Received from RMU (not yet assigned)',
  sent_to_registration: 'Sent to Registration & Reservation',
  received_from_registration: 'Received from Registration',
  sent_to_capturing: 'Sent to Capturing',
  received_from_capturing: 'Received from Capturing',
  sent_to_examination: 'Sent to Examination',
  received_from_examination: 'Received from Examination',
  sent_to_approval: 'Sent to Approval',
  received_from_approval: 'Received from Approval',
  returned_to_rmu: 'Returned to RMU'
}

// All files currently in the Controller workflow
const getControllerFiles = async (req, res) => {
  try {
    const files = await LotAllocationRequest.find({ controllerStage: { $ne: null } })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ controllerStageUpdatedAt: -1 })
    res.status(200).json({ success: true, count: files.length, data: files })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Move a file to the next stage (send / receive)
const moveStage = async (req, res) => {
  try {
    const { stage } = req.body
    if (!stage || !Object.prototype.hasOwnProperty.call(STAGE_LABELS, stage)) {
      return res.status(400).json({ success: false, message: 'A valid target stage is required' })
    }

    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    const current = record.controllerStage
    if (!current) {
      return res.status(400).json({ success: false, message: 'File is not in the Controller workflow yet' })
    }

    const allowed = TRANSITIONS[current] || []
    if (!allowed.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move from "${STAGE_LABELS[current]}" to "${STAGE_LABELS[stage]}"`
      })
    }

    record.controllerStage = stage
    record.controllerStageUpdatedAt = new Date()
    record.controllerHistory.push({ stage, by: req.user.id, at: new Date() })
    await record.save()

    await logAction({
      action: `Controller workflow: ${STAGE_LABELS[stage]}`,
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village})`
    })

    res.status(200).json({ success: true, message: STAGE_LABELS[stage], data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Return the file to the RMU — allowed at any "received" action point.
// If the file completed Approval, the outcome defaults to approved; otherwise
// the Controller states the outcome explicitly.
const returnToRmu = async (req, res) => {
  try {
    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    const current = record.controllerStage
    if (!RETURNABLE_STAGES.includes(current)) {
      return res.status(400).json({
        success: false,
        message: `File cannot be returned to RMU from stage "${STAGE_LABELS[current] || 'none'}" — receive it back from the current section first`
      })
    }

    let { outcome } = req.body
    if (!outcome) outcome = current === 'received_from_approval' ? 'approved' : 'not_approved'
    if (!['approved', 'not_approved'].includes(outcome)) {
      return res.status(400).json({ success: false, message: "Outcome must be 'approved' or 'not_approved'" })
    }

    record.controllerStage = 'returned_to_rmu'
    record.controllerStageUpdatedAt = new Date()
    record.controllerHistory.push({ stage: 'returned_to_rmu', by: req.user.id, at: new Date() })

    // Hand back into the RMU flow — becomes a pending-collection file
    record.rmuStatus = 'returned_from_controller'
    record.rmuOutcome = outcome
    record.rmuReturnedAt = new Date()
    await record.save()

    await logAction({
      action: `Controller returned file to RMU (${outcome.replace('_', ' ')})`,
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village})`
    })

    if (global.io) {
      global.io.to(record.requestedBy.toString()).emit('lotRequestUpdate', {
        requestId: record._id,
        message: `Your file for ${record.village} is ready for collection at the RMU (${outcome.replace('_', ' ')})`
      })
    }

    res.status(200).json({ success: true, message: 'File returned to RMU — pending collection', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getControllerFiles, moveStage, returnToRmu }

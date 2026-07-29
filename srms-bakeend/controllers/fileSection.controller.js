const LotAllocationRequest = require('../models/LotAllocationRequest.model')
const logAction = require('../utils/auditLogger')

// ---------------------------------------------------------------------------
// File section sub-role dashboards (per client's Controller workflow schema)
//
// The Controller sends a file to one of four DSM sections in turn:
//   Registration & Reservation -> Capturing -> Examination -> Approval
// Each section's own sub-role (not the Controller) picks the file up from
// their queue, takes their action, and it lands back on the Controller's
// desk ("received back") for the Controller to send onward or return to RMU.
// Examination and Approval additionally record a Pass / Fail outcome.
// ---------------------------------------------------------------------------

const SECTIONS = {
  registration: {
    label: 'File Registration & Reservation',
    queueStage: 'sent_to_registration',
    doneStage: 'received_from_registration',
    capabilities: ['register_file', 'reserve_file'],
    hasOutcome: false
  },
  capturing: {
    label: 'File Capturing',
    queueStage: 'sent_to_capturing',
    doneStage: 'received_from_capturing',
    capabilities: ['capture_file'],
    hasOutcome: false
  },
  examination: {
    label: 'File Examination',
    queueStage: 'sent_to_examination',
    doneStage: 'received_from_examination',
    capabilities: ['examine_file'],
    hasOutcome: true,
    outcomeField: 'examinationOutcome'
  },
  approval: {
    label: 'File Approval',
    queueStage: 'sent_to_approval',
    doneStage: 'received_from_approval',
    capabilities: ['approve_file'],
    hasOutcome: true,
    outcomeField: 'approvalOutcome'
  }
}

const getSectionConfig = (key) => SECTIONS[key]

// Files received from the Controller for this section, not yet actioned
const getSectionQueue = async (req, res) => {
  try {
    const config = getSectionConfig(req.params.section)
    if (!config) return res.status(404).json({ success: false, message: 'Unknown section' })

    const files = await LotAllocationRequest.find({ controllerStage: config.queueStage })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ controllerStageUpdatedAt: -1 })
    res.status(200).json({ success: true, count: files.length, data: files })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Files this section has already actioned, awaiting the Controller to move them on
const getSectionCompleted = async (req, res) => {
  try {
    const config = getSectionConfig(req.params.section)
    if (!config) return res.status(404).json({ success: false, message: 'Unknown section' })

    const files = await LotAllocationRequest.find({ controllerStage: config.doneStage })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ controllerStageUpdatedAt: -1 })
    res.status(200).json({ success: true, count: files.length, data: files })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Take this section's action on a file — moves it back to the Controller
// ("Return to Controller" in the client's diagram). Examination / Approval
// require a pass/fail outcome.
const takeSectionAction = async (req, res) => {
  try {
    const config = getSectionConfig(req.params.section)
    if (!config) return res.status(404).json({ success: false, message: 'Unknown section' })

    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    if (record.controllerStage !== config.queueStage) {
      return res.status(400).json({
        success: false,
        message: `File is not awaiting action in ${config.label} (current stage: ${record.controllerStage || 'none'})`
      })
    }

    if (config.hasOutcome) {
      const { outcome } = req.body
      if (!['pass', 'fail'].includes(outcome)) {
        return res.status(400).json({ success: false, message: "Outcome must be 'pass' or 'fail'" })
      }
      record[config.outcomeField] = outcome
    }

    record.controllerStage = config.doneStage
    record.controllerStageUpdatedAt = new Date()
    record.controllerHistory.push({ stage: config.doneStage, by: req.user.id, at: new Date() })
    await record.save()

    await logAction({
      action: `${config.label}: action taken${config.hasOutcome ? ` (${req.body.outcome})` : ''} — returned to Controller`,
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village})`
    })

    res.status(200).json({ success: true, message: `${config.label} complete — returned to Controller`, data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Send a comment to the surveyor about this file from within a section
const sendSectionComment = async (req, res) => {
  try {
    const config = getSectionConfig(req.params.section)
    if (!config) return res.status(404).json({ success: false, message: 'Unknown section' })

    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Comment message is required' })
    }

    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    record.controllerComments.push({
      stage: req.params.section,
      message: message.trim(),
      sentBy: req.user.id,
      sentAt: new Date()
    })
    await record.save()

    await logAction({
      action: `${config.label} sent comment to surveyor`,
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village}) — ${message.trim()}`
    })

    if (global.io) {
      global.io.to(record.requestedBy.toString()).emit('lotRequestUpdate', {
        requestId: record._id,
        message: `${config.label} comment on your ${record.village} file: ${message.trim()}`
      })
    }

    res.status(200).json({ success: true, message: 'Comment sent to surveyor', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { SECTIONS, getSectionQueue, getSectionCompleted, takeSectionAction, sendSectionComment }

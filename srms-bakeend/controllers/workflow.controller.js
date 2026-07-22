const File = require('../models/File.model')
const logAction = require('../utils/auditLogger')
const { sendStatusEmail } = require('../utils/emailService')
const User = require('../models/User.model')

const STAGE_ORDER = [
  'submitted',
  'capturing',
  'examination',
  'approval',
  'dispatch',
  'archived'
]

const getNextStage = (currentStage) => {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null
  }
  return STAGE_ORDER[currentIndex + 1]
}

const STAGE_ROLES = {
  capturing:   ['officer'],
  examination: ['officer'],
  approval:    ['approver'],
  dispatch:    ['officer']
}

// Process a gate — pass or fail
const processGate = async (req, res) => {
  try {
    const { fileId } = req.params
    const { action, remarks } = req.body

    if (!['pass', 'fail'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be pass or fail'
      })
    }

    const file = await File.findById(fileId)
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    if (file.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'File is already archived'
      })
    }

    if (file.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'File has been rejected'
      })
    }

    let currentStage = file.currentStage

    // Auto-advance from submitted to capturing when officer opens it
    if (currentStage === 'submitted' && req.user.role === 'officer') {
      file.currentStage = 'capturing'
      file.status = 'capturing'
      currentStage = 'capturing'

      await logAction({
        fileId: file._id,
        action: 'File received by DSM — moved to capturing stage',
        performedBy: req.user.id,
        role: req.user.role,
        remarks: 'Auto-advanced from submitted to capturing'
      })
    }

    const allowedRoles = STAGE_ROLES[currentStage]

    if (!allowedRoles) {
      return res.status(400).json({
        success: false,
        message: `File is at stage ${currentStage} and cannot be processed`
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Your role cannot process the ${currentStage} stage`
      })
    }

    if (action === 'fail' && !remarks) {
      return res.status(400).json({
        success: false,
        message: 'Remarks are required when failing a stage'
      })
    }

    const stageIndex = file.stages.findIndex(s => s.name === currentStage)
    if (stageIndex !== -1) {
      file.stages[stageIndex].status = action === 'pass' ? 'passed' : 'failed'
      file.stages[stageIndex].processedBy = req.user.id
      file.stages[stageIndex].remarks = remarks || ''
      file.stages[stageIndex].timestamp = new Date()
    }

    if (action === 'pass') {
      const nextStage = getNextStage(currentStage)
      file.currentStage = nextStage
      file.status = nextStage

      await logAction({
        fileId: file._id,
        action: `Stage ${currentStage} passed → moved to ${nextStage}`,
        performedBy: req.user.id,
        role: req.user.role,
        remarks: remarks || 'No remarks'
      })

      await file.save()

      const surveyor = await User.findById(file.surveyorId)
      if (surveyor) {
        await sendStatusEmail({
          to: surveyor.email,
          name: surveyor.name,
          plotNumber: file.plotNumber,
          status: nextStage,
          remarks: remarks || ''
        })
      }

      global.io.to(file.surveyorId.toString()).emit('fileStatusUpdate', {
        plotNumber: file.plotNumber,
        status: nextStage,
        message: `Your file ${file.plotNumber} moved to ${nextStage}`
      })

      return res.status(200).json({
        success: true,
        message: `File passed ${currentStage} and moved to ${nextStage}`,
        data: {
          fileId: file._id,
          plotNumber: file.plotNumber,
          previousStage: currentStage,
          currentStage: nextStage,
          status: file.status
        }
      })
    }

    if (action === 'fail') {
      file.status = 'rework'
      file.currentStage = 'rework'

      await logAction({
        fileId: file._id,
        action: `Stage ${currentStage} failed → returned for rework`,
        performedBy: req.user.id,
        role: req.user.role,
        remarks
      })

      await file.save()

      const surveyor = await User.findById(file.surveyorId)
      if (surveyor) {
        await sendStatusEmail({
          to: surveyor.email,
          name: surveyor.name,
          plotNumber: file.plotNumber,
          status: 'rework',
          remarks
        })
      }

      global.io.to(file.surveyorId.toString()).emit('fileStatusUpdate', {
        plotNumber: file.plotNumber,
        status: 'rework',
        message: `Your file ${file.plotNumber} requires rework. Reason: ${remarks}`
      })

      return res.status(200).json({
        success: true,
        message: `File failed ${currentStage} and returned to surveyor for rework`,
        data: {
          fileId: file._id,
          plotNumber: file.plotNumber,
          failedStage: currentStage,
          status: 'rework',
          remarks
        }
      })
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Reject a file — officer or approver
const rejectFile = async (req, res) => {
  try {
    const { fileId } = req.params
    const { remarks } = req.body

    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: 'Rejection remarks are required'
      })
    }

    const file = await File.findById(fileId)
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    if (['archived', 'rejected'].includes(file.status)) {
      return res.status(400).json({
        success: false,
        message: `File is already ${file.status}`
      })
    }

    if (!['officer', 'approver', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject files'
      })
    }

    file.status = 'rejected'
    file.currentStage = 'rejected'
    file.rejectedBy = req.user.id
    file.rejectionRemarks = remarks

    await logAction({
      fileId: file._id,
      action: `File rejected by ${req.user.role}`,
      performedBy: req.user.id,
      role: req.user.role,
      remarks
    })

    await file.save()

    const surveyor = await User.findById(file.surveyorId)
    if (surveyor) {
      await sendStatusEmail({
        to: surveyor.email,
        name: surveyor.name,
        plotNumber: file.plotNumber,
        status: 'rejected',
        remarks
      })
    }

    global.io.to(file.surveyorId.toString()).emit('fileStatusUpdate', {
      plotNumber: file.plotNumber,
      status: 'rejected',
      message: `Your file ${file.plotNumber} has been rejected. Reason: ${remarks}`
    })

    res.status(200).json({
      success: true,
      message: 'File rejected successfully',
      data: {
        fileId: file._id,
        plotNumber: file.plotNumber,
        status: 'rejected',
        remarks
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Surveyor appeals a rejected file (once only)
const appealFile = async (req, res) => {
  try {
    const { fileId } = req.params
    const { remarks } = req.body

    const file = await File.findById(fileId)
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    if (file.surveyorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to appeal this file'
      })
    }

    if (file.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only rejected files can be appealed'
      })
    }

    if (file.appealCount >= 1) {
      return res.status(400).json({
        success: false,
        message: 'You have already used your one appeal for this file'
      })
    }

    file.status = 'capturing'
    file.currentStage = 'capturing'
    file.appealCount = 1

    // Reset stages
    file.stages = file.stages.map(s => ({
      ...s.toObject(),
      status: 'pending',
      remarks: '',
      processedBy: null,
      timestamp: null
    }))

    await logAction({
      fileId: file._id,
      action: 'Surveyor appealed rejected file — returned to capturing',
      performedBy: req.user.id,
      role: req.user.role,
      remarks: remarks || 'Appeal submitted'
    })

    await file.save()

    res.status(200).json({
      success: true,
      message: 'Appeal submitted successfully. File returned to processing.',
      data: {
        fileId: file._id,
        plotNumber: file.plotNumber,
        status: file.status,
        currentStage: file.currentStage
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Surveyor updates their submitted file
const updateFile = async (req, res) => {
  try {
    const { fileId } = req.params

    const file = await File.findById(fileId)
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    if (file.surveyorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this file'
      })
    }

    const editableStatuses = ['submitted', 'rework']
    if (!editableStatuses.includes(file.status)) {
      return res.status(400).json({
        success: false,
        message: 'File can only be updated when in submitted or rework status'
      })
    }

    // Add new documents if uploaded
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map(f => ({
        url: f.path,
        name: f.originalname,
        uploadedAt: new Date()
      }))
      file.documents = [...file.documents, ...newDocs]
    }

    await logAction({
      fileId: file._id,
      action: 'Surveyor updated file documents',
      performedBy: req.user.id,
      role: req.user.role,
      remarks: 'File updated by surveyor'
    })

    await file.save()

    res.status(200).json({
      success: true,
      message: 'File updated successfully',
      data: file
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Surveyor resubmits file after rework
const resubmitFile = async (req, res) => {
  try {
    const { fileId } = req.params
    const { remarks } = req.body

    const file = await File.findById(fileId)
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    if (file.surveyorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to resubmit this file'
      })
    }

    if (file.status !== 'rework') {
      return res.status(400).json({
        success: false,
        message: 'File is not in rework status'
      })
    }

    const failedStage = file.stages.find(s => s.status === 'failed')
    if (failedStage) {
      failedStage.status = 'pending'
      failedStage.remarks = ''
      failedStage.processedBy = null
      failedStage.timestamp = null
    }

    file.status = failedStage ? failedStage.name : 'capturing'
    file.currentStage = failedStage ? failedStage.name : 'capturing'

    await logAction({
      fileId: file._id,
      action: 'File resubmitted after rework',
      performedBy: req.user.id,
      role: req.user.role,
      remarks: remarks || 'File corrected and resubmitted'
    })

    await file.save()

    const surveyor = await User.findById(file.surveyorId)
    if (surveyor) {
      await sendStatusEmail({
        to: surveyor.email,
        name: surveyor.name,
        plotNumber: file.plotNumber,
        status: file.status,
        remarks: remarks || 'File corrected and resubmitted'
      })
    }

    global.io.to(file.surveyorId.toString()).emit('fileStatusUpdate', {
      plotNumber: file.plotNumber,
      status: file.status,
      message: `Your file ${file.plotNumber} has been resubmitted successfully`
    })

    res.status(200).json({
      success: true,
      message: 'File resubmitted successfully',
      data: {
        fileId: file._id,
        plotNumber: file.plotNumber,
        currentStage: file.currentStage,
        status: file.status
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get files in queue for officer/approver
const getQueue = async (req, res) => {
  try {
    let query = {}

    if (req.user.role === 'officer') {
      query.status = {
        $in: ['submitted', 'capturing', 'examination', 'dispatch']
      }
    }

    if (req.user.role === 'approver') {
      query.status = 'approval'
    }

    const files = await File.find(query)
      .populate('surveyorId', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Delete a single document from a file (surveyor only, submitted/rework status)
const deleteDocument = async (req, res) => {
  try {
    const { fileId, docIndex } = req.params
    const file = await File.findById(fileId)
    if (!file) return res.status(404).json({ success: false, message: 'File not found' })
    if (file.surveyorId.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' })
    if (!['submitted', 'rework'].includes(file.status))
      return res.status(400).json({ success: false, message: 'Cannot edit file at this stage' })

    const idx = parseInt(docIndex, 10)
    if (idx < 0 || idx >= file.documents.length)
      return res.status(400).json({ success: false, message: 'Invalid document index' })

    file.documents.splice(idx, 1)
    await file.save()
    await logAction({ fileId: file._id, action: 'Document deleted by surveyor', performedBy: req.user.id, role: req.user.role })
    res.status(200).json({ success: true, message: 'Document deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { processGate, rejectFile, appealFile, updateFile, resubmitFile, deleteDocument, getQueue }
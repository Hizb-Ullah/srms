const File = require('../models/File.model')
const PlotNumber = require('../models/PlotNumber.model')
const logAction = require('../utils/auditLogger')

const submitFile = async (req, res) => {
  try {
    const { plotNumber, surveyRecordNumber } = req.body

    const plot = await PlotNumber.findOne({
      plotNumber,
      surveyorId: req.user.id
    })

    if (!plot) {
      return res.status(404).json({
        success: false,
        message: 'Plot number not found or does not belong to you'
      })
    }

    const existingFile = await File.findOne({ plotNumber })
    if (existingFile) {
      return res.status(400).json({
        success: false,
        message: 'File already submitted for this plot number'
      })
    }

    const documents = req.files ? req.files.map(file => ({
      url: file.path,
      name: file.originalname,
      uploadedAt: new Date()
    })) : []

    const newFile = await File.create({
      plotNumber,
      surveyRecordNumber,
      surveyorId: req.user.id,
      status: 'submitted',
      currentStage: 'submitted',
      documents,
      stages: [
        { name: 'capturing',   status: 'pending' },
        { name: 'examination', status: 'pending' },
        { name: 'approval',    status: 'pending' },
        { name: 'dispatch',    status: 'pending' }
      ]
    })

    await logAction({
      fileId: newFile._id,
      action: 'File submitted to DSM',
      performedBy: req.user.id,
      role: req.user.role,
      remarks: `Plot: ${plotNumber} | Record: ${surveyRecordNumber}`
    })

    res.status(201).json({
      success: true,
      message: 'File submitted successfully',
      data: newFile
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getMyFiles = async (req, res) => {
  try {
    const files = await File.find({
      surveyorId: req.user.id
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('surveyorId', 'name email')

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    if (
      file.surveyorId._id.toString() !== req.user.id &&
      !['officer', 'approver', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this file' })
    }

    res.status(200).json({ success: true, data: file })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getAllFiles = async (req, res) => {
  try {
    const files = await File.find()
      .populate('surveyorId', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, count: files.length, data: files })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getFileAudit = async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog.model')
    const logs = await AuditLog.find({ fileId: req.params.id })
      .populate('performedBy', 'name role')
      .sort({ timestamp: -1 })

    res.status(200).json({ success: true, count: logs.length, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update file — only allowed if status is submitted or rework
const updateFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    if (file.surveyorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this file' })
    }

    const editableStatuses = ['submitted', 'rework']
    if (!editableStatuses.includes(file.status)) {
      return res.status(400).json({
        success: false,
        message: 'File cannot be edited after it has been processed'
      })
    }

    // Update survey record number if provided
    if (req.body.surveyRecordNumber) {
      file.surveyRecordNumber = req.body.surveyRecordNumber
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

    // Remove documents if requested
    if (req.body.removeDocIds) {
      const removeIds = JSON.parse(req.body.removeDocIds)
      file.documents = file.documents.filter(
        (doc, index) => !removeIds.includes(index)
      )
    }

    await file.save()

    await logAction({
      fileId: file._id,
      action: 'File details updated by surveyor',
      performedBy: req.user.id,
      role: req.user.role,
      remarks: 'Surveyor edited file details'
    })

    res.status(200).json({
      success: true,
      message: 'File updated successfully',
      data: file
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  submitFile,
  getMyFiles,
  getFile,
  getAllFiles,
  getFileAudit,
  updateFile
}
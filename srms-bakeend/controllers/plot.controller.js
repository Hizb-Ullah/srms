const PlotNumber = require('../models/PlotNumber.model')
const AuditLog = require('../models/AuditLog.model')
const { 
  generatePlotNumber, 
  generateSurveyRecordNumber 
} = require('../utils/numberGenerator')

// Request a new plot number
const requestPlotNumber = async (req, res) => {
  try {
    const { location, requestType, cadastreNumber, landBoard } = req.body

    // Generate unique numbers
    const plotNumber = await generatePlotNumber()
    const surveyRecordNumber = await generateSurveyRecordNumber()

    // Double-check uniqueness (race condition protection)
    const existing = await PlotNumber.findOne({ plotNumber })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Plot number conflict — please try again'
      })
    }

    // Save to database
    const plot = await PlotNumber.create({
      plotNumber,
      surveyRecordNumber,
      surveyorId: req.user.id,
      isAssigned: true,
      location: location || '',
      requestType: requestType || 'single_plot',
      cadastreNumber: cadastreNumber || '',
      landBoard: landBoard || ''
    })

    // Log this action in audit trail
    await AuditLog.create({
      action: `Plot number ${plotNumber} requested and issued`,
      performedBy: req.user.id,
      role: req.user.role,
      remarks: `Survey record number: ${surveyRecordNumber}`
    })

    res.status(201).json({
      success: true,
      message: 'Plot number issued successfully',
      data: {
        plotNumber: plot.plotNumber,
        surveyRecordNumber: plot.surveyRecordNumber,
        issuedAt: plot.createdAt
      }
    })
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    })
  }
}


// Get all plot numbers for logged in surveyor
const getMyPlotNumbers = async (req, res) => {
  try {
    const File = require('../models/File.model')

    const plots = await PlotNumber.find({ 
      surveyorId: req.user.id 
    }).sort({ createdAt: -1 })

    const submittedPlotNumbers = await File.find({
      surveyorId: req.user.id
    }).distinct('plotNumber')

    const plotsWithStatus = plots.map((plot) => ({
      ...plot.toObject(),
      fileSubmitted: submittedPlotNumbers.includes(plot.plotNumber)
    }))

    res.status(200).json({
      success: true,
      count: plotsWithStatus.length,
      data: plotsWithStatus
    })
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    })
  }
}

// Get single plot number by id
const getPlotNumber = async (req, res) => {
  try {
    const plot = await PlotNumber.findById(req.params.id)
      .populate('surveyorId', 'name email')

    if (!plot) {
      return res.status(404).json({ 
        success: false,
        message: 'Plot number not found' 
      })
    }

    res.status(200).json({
      success: true,
      data: plot
    })
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    })
  }
}

// Get all plot numbers - admin and officer only
const getAllPlotNumbers = async (req, res) => {
  try {
    const plots = await PlotNumber.find()
      .populate('surveyorId', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: plots.length,
      data: plots
    })
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    })
  }
}
// Search by plot number — role aware
const searchByPlotNumber = async (req, res) => {
  try {
    const { plotNumber } = req.params
    const File = require('../models/File.model')
    const AuditLog = require('../models/AuditLog.model')

    const query = { plotNumber: { $regex: plotNumber, $options: 'i' } }

    // Surveyor can only see their own
    if (req.user.role === 'surveyor') {
      query.surveyorId = req.user.id
    }

    const plot = await PlotNumber.findOne(query)
      .populate('surveyorId', 'name email')

    if (!plot) {
      return res.status(404).json({
        success: false,
        message: 'Plot number not found'
      })
    }

    const file = await File.findOne({ plotNumber: plot.plotNumber })
      .populate('surveyorId', 'name email')

    const logs = file ? await AuditLog.find({ fileId: file._id })
      .populate('performedBy', 'name role')
      .sort({ timestamp: -1 }) : []

    res.status(200).json({
      success: true,
      data: {
        plot,
        file: file || null,
        auditLogs: logs
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
// Delete an unsubmitted plot number (surveyor only, before file is submitted)
const deletePlotNumber = async (req, res) => {
  try {
    const File = require('../models/File.model')
    const plot = await PlotNumber.findOne({ _id: req.params.id, surveyorId: req.user.id })
    if (!plot) return res.status(404).json({ success: false, message: 'Plot not found' })

    const fileExists = await File.findOne({ plotNumber: plot.plotNumber })
    if (fileExists) return res.status(400).json({ success: false, message: 'Cannot delete — file already submitted for this plot' })

    await plot.deleteOne()
    await AuditLog.create({
      action: `Plot number ${plot.plotNumber} deleted by surveyor`,
      performedBy: req.user.id,
      role: req.user.role
    })
    res.status(200).json({ success: true, message: 'Plot number deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { 
  requestPlotNumber, 
  getMyPlotNumbers, 
  getPlotNumber,
  getAllPlotNumbers,
  searchByPlotNumber,
  deletePlotNumber
}
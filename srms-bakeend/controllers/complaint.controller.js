const Complaint = require('../models/Complaint.model')
const LotAllocationRequest = require('../models/LotAllocationRequest.model')

// Surveyor submits a complaint about a slow/stalled lot request
const submitComplaint = async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' })

    const request = await LotAllocationRequest.findById(req.params.requestId)
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
    if (request.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your request' })
    }

    const complaint = await Complaint.create({
      submittedBy: req.user.id,
      requestId: request._id,
      message: message.trim()
    })

    // Notify DSM staff via socket
    if (global.io) {
      global.io.emit('newComplaint', {
        complaintId: complaint._id,
        village: request.village,
        message: complaint.message
      })
    }

    res.status(201).json({ success: true, message: 'Complaint submitted', data: complaint })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// DSM staff / Director — view all open complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('submittedBy', 'name email surveyorCode')
      .populate('requestId', 'village requestType status')
      .sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: complaints.length, data: complaints })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Surveyor — view own complaints
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ submittedBy: req.user.id })
      .populate('requestId', 'village requestType status')
      .sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: complaints })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// DSM staff resolves a complaint
const resolveComplaint = async (req, res) => {
  try {
    const { resolution } = req.body
    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' })
    if (complaint.status === 'resolved') return res.status(400).json({ success: false, message: 'Already resolved' })

    complaint.status = 'resolved'
    complaint.resolvedBy = req.user.id
    complaint.resolvedAt = new Date()
    complaint.resolution = resolution?.trim() || ''
    await complaint.save()

    res.status(200).json({ success: true, message: 'Complaint resolved' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { submitComplaint, getAllComplaints, getMyComplaints, resolveComplaint }

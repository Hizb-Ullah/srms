const LotAllocationRequest = require('../models/LotAllocationRequest.model')

// ---------------------------------------------------------------------------
// Storage — files RMU has dispatched to storage after the surveyor collects
// them. The Storage office scans and stores them online and files the hard
// copies. Read-only view; RMU is the one who performs "Send to Storage".
// ---------------------------------------------------------------------------
const getStorageFiles = async (req, res) => {
  try {
    const records = await LotAllocationRequest.find({ rmuStatus: 'in_storage' })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ rmuStorageAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getStorageFiles }

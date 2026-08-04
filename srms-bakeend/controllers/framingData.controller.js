const FramingDataRequest = require('../models/FramingDataRequest.model')
const logAction = require('../utils/auditLogger')

// ---------------------------------------------------------------------------
// Request Framing Data — per client: last item on the Land Surveyor's side.
// The surveyor enters the Lot Number and Village of the framing data they're
// requesting. No receiving department or outcome was specified by the
// client, so this is submission + the surveyor's own tracking list only —
// logged to the audit trail so it isn't a dead end.
// ---------------------------------------------------------------------------

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

    res.status(201).json({ success: true, message: 'Framing data request submitted', data: request })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getMyFramingDataRequests = async (req, res) => {
  try {
    const requests = await FramingDataRequest.find({ requestedBy: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: requests.length, data: requests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { submitFramingDataRequest, getMyFramingDataRequests }

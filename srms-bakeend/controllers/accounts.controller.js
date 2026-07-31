const LotAllocationRequest = require('../models/LotAllocationRequest.model')
const logAction = require('../utils/auditLogger')

// ---------------------------------------------------------------------------
// Accounts (per client's Accounts schema: Add Payment → SR# → Receipt# →
// Add/Accept)
//
// Once a request is finally authorised by the Lot Allocator, it lands in the
// Accounts queue. Accounts logs their own official receipt number against the
// request's SR#(s) and accepts it. This is bookkeeping only — it does not
// affect the lot-allocation/RMU/Controller pipeline status.
// ---------------------------------------------------------------------------

// Queue — authorised requests not yet logged by Accounts
const getAccountsQueue = async (req, res) => {
  try {
    const records = await LotAllocationRequest.find({ status: 'approved', accountsAcceptedAt: null })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ approvedAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Completed — requests Accounts has already logged/accepted
const getAccountsCompleted = async (req, res) => {
  try {
    const records = await LotAllocationRequest.find({ accountsAcceptedAt: { $ne: null } })
      .populate('requestedBy', 'name email surveyorCode')
      .sort({ accountsAcceptedAt: -1 })
    res.status(200).json({ success: true, count: records.length, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Add Payment / Add-Accept — Accounts logs their receipt number for this
// already-authorised request
const acceptPayment = async (req, res) => {
  try {
    const { receiptNumber } = req.body
    if (!receiptNumber || !receiptNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Receipt number is required' })
    }

    const record = await LotAllocationRequest.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    if (record.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only authorised requests can be logged by Accounts' })
    }
    if (record.accountsAcceptedAt) {
      return res.status(400).json({ success: false, message: 'Accounts has already logged this request' })
    }

    record.accountsReceiptNumber = receiptNumber.trim()
    record.accountsAcceptedBy = req.user.id
    record.accountsAcceptedAt = new Date()
    await record.save()

    await logAction({
      action: 'Accounts logged payment and accepted request',
      performedBy: req.user.id,
      role: req.user.subRole || req.user.role,
      remarks: `Record ${record._id} (${record.village}) — receipt ${receiptNumber.trim()}`
    })

    res.status(200).json({ success: true, message: 'Payment logged and accepted', data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getAccountsQueue, getAccountsCompleted, acceptPayment }

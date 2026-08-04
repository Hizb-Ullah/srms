const mongoose = require('mongoose')

// Per client: the last item on the Land Surveyor's side — the surveyor
// requests "framing data" by entering the Lot Number and Village of the
// record they're asking about. Client did not specify a receiving
// department or outcome, so this is submission + tracking only for now.
const framingDataRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lotNumber: { type: String, required: true, trim: true },
  village: { type: String, required: true, trim: true }
}, { timestamps: true })

module.exports = mongoose.model('FramingDataRequest', framingDataRequestSchema)

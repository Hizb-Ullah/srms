const PlotNumber = require('../models/PlotNumber.model')

// Generate next plot number
const generatePlotNumber = async () => {
  const year = new Date().getFullYear()
  
  // Find the last plot number created this year
  const lastPlot = await PlotNumber.findOne({
    plotNumber: { $regex: `PLT-${year}` }
  }).sort({ createdAt: -1 })

  let nextNumber = 1

  if (lastPlot) {
    // Extract the number from PLT-2026-00001
    const lastNumber = parseInt(lastPlot.plotNumber.split('-')[2])
    nextNumber = lastNumber + 1
  }

  // Format: PLT-2026-00001 (always 5 digits)
  const formatted = String(nextNumber).padStart(5, '0')
  return `PLT-${year}-${formatted}`
}

// Generate next survey record number
const generateSurveyRecordNumber = async () => {
  const year = new Date().getFullYear()

  // Find the last survey record number created this year
  const lastRecord = await PlotNumber.findOne({
    surveyRecordNumber: { $regex: `SRN-${year}` }
  }).sort({ createdAt: -1 })

  let nextNumber = 1

  if (lastRecord) {
    // Extract the number from SRN-2026-00001
    const lastNumber = parseInt(lastRecord.surveyRecordNumber.split('-')[2])
    nextNumber = lastNumber + 1
  }

  // Format: SRN-2026-00001 (always 5 digits)
  const formatted = String(nextNumber).padStart(5, '0')
  return `SRN-${year}-${formatted}`
}

module.exports = { generatePlotNumber, generateSurveyRecordNumber }
const Counter = require('../models/Counter.model')

const nextSequence = async (key) => {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  return counter.seq
}

// Format: "Lot 102 Gaborone" — matches Ted's diary exactly
const generatePlotNumbersForVillage = async (village, count) => {
  const label = village.trim()
  const numbers = []
  for (let i = 0; i < count; i++) {
    const seq = await nextSequence(`plot-${label.toLowerCase().replace(/\s+/g, '-')}`)
    numbers.push(`Lot ${seq} ${label}`)
  }
  return numbers
}

// Format: "10/2026" — matches Ted's diary SR#
const generateSurveyRecordNumbers = async (count) => {
  const year = new Date().getFullYear()
  const numbers = []
  for (let i = 0; i < count; i++) {
    const seq = await nextSequence(`sr-${year}`)
    numbers.push(`${seq}/${year}`)
  }
  return numbers
}

// Format: "114/2026" — matches Ted's diary DSM#
// Each plot gets its own DSM# (confirmed by Ted: "each will have its own DSM")
const generateDsmNumbers = async (count) => {
  const year = new Date().getFullYear()
  const numbers = []
  for (let i = 0; i < count; i++) {
    const seq = await nextSequence(`dsm-${year}`)
    numbers.push(`${seq}/${year}`)
  }
  return numbers
}

// Format: "95641" — 5-digit OS# (matches Ted's diary OS: 95634, 95641)
// OS# is per-plot, not inherited from parent (confirmed by Ted's notes)
const generateOsNumbers = async (count) => {
  const numbers = []
  for (let i = 0; i < count; i++) {
    const seq = await nextSequence('os-global')
    // Start from 90000 range to match Ted's examples (95634, 95641)
    numbers.push(String(90000 + seq))
  }
  return numbers
}

module.exports = {
  generatePlotNumbersForVillage,
  generateSurveyRecordNumbers,
  generateDsmNumbers,
  generateOsNumbers
}

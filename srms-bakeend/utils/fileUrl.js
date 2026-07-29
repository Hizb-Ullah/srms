// Builds the public URL for a file saved by upload.middleware.js's disk
// storage, served back out via the static route mounted at /api/uploads.
const getFileUrl = (req, filename) => `${req.protocol}://${req.get('host')}/api/uploads/${filename}`

module.exports = { getFileUrl }

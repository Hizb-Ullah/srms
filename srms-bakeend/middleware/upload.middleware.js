const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Files are stored on the server's own disk instead of a third-party service
// (Cloudinary kept blocking uploads with account-level restrictions). Served
// back out via the static route mounted at /api/uploads in server.js.
const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, unique)
  }
})

// Includes zip/shp/dbf/shx/prj so a bundled or unbundled GIS shapefile can be
// submitted for a Shape File Scratch (data consistency check) request.
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|zip|shp|dbf|shx|prj/
  const extname = allowedTypes.test(file.originalname.toLowerCase())
  if (extname) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF, DOC, DOCX, JPG, PNG, ZIP, or shapefile (SHP/DBF/SHX/PRJ) files allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
})

module.exports = upload

import axios from 'axios'
import Cookies from 'js-cookie'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

API.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const loginUser            = (data) => API.post('/auth/login', data)
export const registerUser         = (data) => API.post('/auth/register', data)
export const getMe                = ()     => API.get('/auth/me')
export const requestPasswordReset = (data) => API.post('/auth/forgot-password', data)
export const checkAdminExists     = ()     => API.get('/auth/admin-exists')

// Plots
export const requestPlot       = ()           => API.post('/plots/request')
export const getMyPlots        = ()           => API.get('/plots/my')
export const deletePlot        = (id)         => API.delete(`/plots/${id}`)
export const getAllPlots        = ()           => API.get('/plots')
export const searchPlotNumber  = (plotNumber) => API.get(`/plots/search/${plotNumber}`)

// Files
export const submitFile    = (data) => API.post('/files/submit', data)
export const getMyFiles    = ()     => API.get('/files/my')
export const getAllFiles    = ()     => API.get('/files')
export const getFile       = (id)   => API.get(`/files/${id}`)
export const getFileAudit  = (id)   => API.get(`/files/${id}/audit`)

// Workflow
export const processGate   = (fileId, data) => API.patch(`/workflow/${fileId}/gate`, data)
export const rejectFile    = (fileId, data) => API.patch(`/workflow/${fileId}/reject`, data)
export const appealFile    = (fileId, data) => API.patch(`/workflow/${fileId}/appeal`, data)
export const updateFile    = (fileId, data) => API.patch(`/workflow/${fileId}/update`, data)
export const resubmitFile  = (fileId, data) => API.patch(`/workflow/${fileId}/resubmit`, data)
export const deleteDocument = (fileId, docIndex) => API.delete(`/workflow/${fileId}/documents/${docIndex}`)
export const getQueue      = ()             => API.get('/workflow/queue')

// Admin
export const getAllUsers        = ()           => API.get('/admin/users')
export const createUser        = (data)       => API.post('/admin/users', data)
export const updateUser        = (id, data)   => API.put(`/admin/users/${id}`, data)
export const deleteUser        = (id)         => API.delete(`/admin/users/${id}`)
export const requestDeleteUser = (id, data)   => API.post(`/admin/users/${id}/request-delete`, data)
export const confirmDeleteUser = (id)         => API.post(`/admin/users/${id}/confirm-delete`)
export const cancelDeleteUser  = (id)         => API.post(`/admin/users/${id}/cancel-delete`)
export const toggleUserLock    = (id)         => API.patch(`/admin/users/${id}/lock`)
export const resetUserPassword = (id, data)   => API.patch(`/admin/users/${id}/reset-password`, data)
export const approveUserAccount = (id)        => API.patch(`/admin/users/${id}/approve`)
export const getDashboard      = ()           => API.get('/admin/dashboard')
export const getAuditLogs      = ()           => API.get('/admin/audit-logs')
export const getResetRequests  = ()           => API.get('/admin/reset-requests')
export const resolveResetRequest = (id)       => API.patch(`/admin/reset-requests/${id}/resolve`)
export const getDirectorStats  = ()           => API.get('/admin/director-stats')

// Lot Allocation
export const createLotRequest      = (data)       => API.post('/lot-requests', data)
export const getMyLotRequests      = ()           => API.get('/lot-requests/my')
export const getAllLotRequests      = ()           => API.get('/lot-requests')
export const reviewLotRequest      = (id, data)   => API.patch(`/lot-requests/${id}/review`, data)
export const uploadPop             = (id, data)   => API.post(`/lot-requests/${id}/pop`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const markPaymentReceived   = (id)         => API.patch(`/lot-requests/${id}/payment-received`)
export const approveLotRequest     = (id)         => API.patch(`/lot-requests/${id}/approve`)
export const rejectLotRequest      = (id, data)   => API.patch(`/lot-requests/${id}/reject`, data)
export const getLastPlotNumber     = (village)    => API.get(`/lot-requests/villages/${village}/last-plot-number`)

// RMU (Records Management Unit)
export const rmuSearchRecord         = (q)         => API.get('/rmu/search', { params: { q } })
export const rmuGetRecords           = (params)    => API.get('/rmu/records', { params })
export const rmuAddNewArrival        = (data)      => API.post('/rmu/new-arrival', data)
export const rmuGetPendingCollections = ()         => API.get('/rmu/pending-collections')
export const rmuReceiveRecord        = (id, data)  => API.patch(`/rmu/${id}/receive`, data)
export const rmuEnterReceipt         = (id, data)  => API.patch(`/rmu/${id}/receipt`, data)
export const rmuSubmitToController   = (id)        => API.patch(`/rmu/${id}/submit-controller`)
export const rmuReturnFromController = (id, data)  => API.patch(`/rmu/${id}/return`, data)
export const rmuMarkCollected        = (id, data)  => API.patch(`/rmu/${id}/collect`, data)
export const rmuSendComment          = (id, data)  => API.patch(`/rmu/${id}/comment`, data)
export const rmuSendStandaloneComment = (data)     => API.post('/rmu/comments', data)
export const rmuGetStandaloneComments = ()         => API.get('/rmu/comments')
export const rmuSendToStorage        = (id)        => API.patch(`/rmu/${id}/storage`)

// Accounts — logs the Accounts-office receipt number against an already-
// authorised request (Add Payment → SR# → Receipt# → Add/Accept). Bookkeeping
// only, no effect on the lot-allocation/RMU/Controller pipeline.
export const getAccountsQueue       = ()          => API.get('/accounts/queue')
export const getAccountsCompleted   = ()          => API.get('/accounts/completed')
export const acceptAccountsPayment  = (id, data)  => API.patch(`/accounts/${id}/accept`, data)
export const acceptAccountsPaymentBySr = (data)   => API.post('/accounts/accept-by-sr', data)

// Storage — read-only view of files RMU has dispatched to storage.
export const getStorageFiles        = ()          => API.get('/storage/files')

// Controller workflow
export const getControllerFiles     = ()          => API.get('/controller/files')
export const moveControllerStage    = (id, data)  => API.patch(`/controller/${id}/stage`, data)
export const returnFileToRmu        = (id, data)  => API.patch(`/controller/${id}/return-rmu`, data)

// File sections (Registration & Reservation / Capturing / Examination / Approval)
export const getSectionQueue        = (section)        => API.get(`/file-sections/${section}/queue`)
export const getSectionCompleted    = (section)        => API.get(`/file-sections/${section}/completed`)
export const takeSectionAction      = (section, id, data) => API.patch(`/file-sections/${section}/${id}/action`, data)
export const sendSectionComment     = (section, id, data) => API.patch(`/file-sections/${section}/${id}/comment`, data)

// Shape File Scratch — data consistency pre-check before submitting a
// layout. Goes directly to the File Controller (not RMU), Controller sends
// to Capturing, Capturing marks passed/failed + uploads a report.
export const submitShapeScratch        = (data)      => API.post('/shape-scratch', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getMyShapeScratchRequests = ()          => API.get('/shape-scratch/my')
export const getControllerScratchRequests = ()       => API.get('/shape-scratch/controller')
export const sendScratchToCapturing    = (id)        => API.patch(`/shape-scratch/${id}/send-to-capturing`)
export const getCapturingScratchQueue     = ()       => API.get('/shape-scratch/capturing/queue')
export const getCapturingScratchCompleted = ()       => API.get('/shape-scratch/capturing/completed')
export const reviewScratchCapturing    = (id, data)  => API.patch(`/shape-scratch/${id}/review`, data, { headers: { 'Content-Type': 'multipart/form-data' } })

// Complaints
export const submitComplaint   = (requestId, data) => API.post(`/complaints/lot-requests/${requestId}`, data)
export const getMyComplaints   = ()                => API.get('/complaints/my')
export const getAllComplaints  = ()                => API.get('/complaints')
export const resolveComplaint  = (id, data)        => API.patch(`/complaints/${id}/resolve`, data)

export default API
import axios from 'axios'
import Cookies from 'js-cookie'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Automatically add token to every request
API.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const loginUser     = (data) => API.post('/auth/login', data)
export const registerUser  = (data) => API.post('/auth/register', data)
export const getMe         = ()     => API.get('/auth/me')

// Plots
export const requestPlot   = ()     => API.post('/plots/request')
export const getMyPlots    = ()     => API.get('/plots/my')
export const getAllPlots    = ()     => API.get('/plots')

// Files
export const submitFile    = (data) => API.post('/files/submit', data)
export const getMyFiles    = ()     => API.get('/files/my')
export const getAllFiles    = ()     => API.get('/files')
export const getFile       = (id)   => API.get(`/files/${id}`)
export const getFileAudit  = (id)   => API.get(`/files/${id}/audit`)

// Workflow
export const processGate   = (fileId, data) => API.patch(`/workflow/${fileId}/gate`, data)
export const resubmitFile  = (fileId, data) => API.patch(`/workflow/${fileId}/resubmit`, data)
export const getQueue      = ()             => API.get('/workflow/queue')

// Admin
export const getAllUsers    = ()     => API.get('/admin/users')
export const toggleUserLock= (id)   => API.patch(`/admin/users/${id}/lock`)
export const getDashboard  = ()     => API.get('/admin/dashboard')
export const getAuditLogs  = ()     => API.get('/admin/audit-logs')

export default API
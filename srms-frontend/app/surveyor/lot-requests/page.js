'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { useAuth } from '@/context/AuthContext'
import {
  createLotRequest,
  getMyLotRequests,
  uploadPop,
  submitComplaint,
  getMyComplaints,
  getLastPlotNumber
} from '@/lib/api'
import toast from 'react-hot-toast'
import { MapPin, Upload, ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

// Village → Cadastre mapping (Botswana cadastre areas)
const VILLAGE_CADASTRE = {
  'Gaborone': 'CAD-001',
  'Francistown': 'CAD-002',
  'Molepolole': 'CAD-003',
  'Serowe': 'CAD-004',
  'Maun': 'CAD-005',
  'Kanye': 'CAD-006',
  'Mahalapye': 'CAD-007',
  'Mogoditshane': 'CAD-008',
  'Mochudi': 'CAD-009',
  'Lobatse': 'CAD-010',
  'Palapye': 'CAD-011',
  'Ramotswa': 'CAD-012',
  'Tlokweng': 'CAD-013',
  'Jwaneng': 'CAD-014',
  'Selebi-Phikwe': 'CAD-015',
  'Orapa': 'CAD-016',
  'Letlhakane': 'CAD-017',
  'Kasane': 'CAD-018',
  'Ghanzi': 'CAD-019',
  'Tsabong': 'CAD-020',
}

const STATUS_LABELS = {
  pending_allocator_review: 'Pending Review',
  awaiting_payment: 'Awaiting Payment',
  pop_uploaded: 'POP Uploaded',
  payment_confirmed: 'Payment Confirmed',
  approved: 'Approved',
  rejected: 'Rejected'
}

const REQUEST_TYPES = [
  { value: 'single_plot', label: 'Single Plot' },
  { value: 'multiple_plot', label: 'Multiple Plots' },
  { value: 'subdivision', label: 'Subdivision' }
]

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default function LotRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [complaints, setComplaints] = useState([])
  const [fetching, setFetching] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [activeTab, setActiveTab] = useState('new')

  const [form, setForm] = useState({
    village: '', requestType: 'single_plot', plotCount: 2,
    parentPlotNumber: '', landBoard: '', cadastreNumber: '', manualPlotStart: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Plot number rules: first-time = manual, subsequent = auto (shown as info)
  const [lastPlot, setLastPlot] = useState(null)
  const [isFirstVillage, setIsFirstVillage] = useState(false)
  const [checkingVillage, setCheckingVillage] = useState(false)

  // POP upload
  const [popFile, setPopFile] = useState(null)
  const [uploadingId, setUploadingId] = useState(null)
  const popRef = useRef()

  // Complaint modal
  const [complaintModal, setComplaintModal] = useState(null) // requestId
  const [complaintMsg, setComplaintMsg] = useState('')
  const [sendingComplaint, setSendingComplaint] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [rRes, cRes] = await Promise.all([getMyLotRequests(), getMyComplaints()])
      setRequests(rRes.data.data)
      setComplaints(cRes.data.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setFetching(false)
    }
  }

  // #11 Village → cadastre auto-fill
  const handleVillageChange = async (village) => {
    const cadastre = VILLAGE_CADASTRE[village] || ''
    setForm(f => ({ ...f, village, cadastreNumber: cadastre }))

    // #12 Plot number rules: check if village has prior requests
    if (village.trim().length > 2) {
      setCheckingVillage(true)
      try {
        const res = await getLastPlotNumber(village.trim())
        setLastPlot(res.data.lastPlotNumber)
        setIsFirstVillage(res.data.isFirstForVillage)
      } catch {
        setLastPlot(null)
      } finally {
        setCheckingVillage(false)
      }
    } else {
      setLastPlot(null)
      setIsFirstVillage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        village: form.village,
        requestType: form.requestType,
        landBoard: form.landBoard,
        cadastreNumber: form.cadastreNumber
      }
      if (form.requestType === 'multiple_plot') payload.plotCount = form.plotCount
      if (form.requestType === 'subdivision') {
        payload.plotCount = form.plotCount
        payload.parentPlotNumber = form.parentPlotNumber
      }
      if (isFirstVillage && form.manualPlotStart) payload.manualPlotStart = form.manualPlotStart
      await createLotRequest(payload)
      toast.success('Lot request submitted successfully')
      setForm({ village: '', requestType: 'single_plot', plotCount: 2, parentPlotNumber: '', landBoard: '', cadastreNumber: '', manualPlotStart: '' })
      setLastPlot(null)
      setIsFirstVillage(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePopUpload = async (requestId) => {
    if (!popFile) return toast.error('Select a file first')
    setUploadingId(requestId)
    try {
      const fd = new FormData()
      fd.append('pop', popFile)
      await uploadPop(requestId, fd)
      toast.success('Proof of Payment uploaded')
      setPopFile(null)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingId(null)
    }
  }

  // #9 Complaint
  const handleComplaint = async () => {
    if (!complaintMsg.trim()) return toast.error('Message is required')
    setSendingComplaint(true)
    try {
      await submitComplaint(complaintModal, { message: complaintMsg })
      toast.success('Complaint submitted to file controller')
      setComplaintModal(null)
      setComplaintMsg('')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSendingComplaint(false)
    }
  }

  const getComplaintForRequest = (requestId) =>
    complaints.find(c => c.requestId?._id === requestId || c.requestId === requestId)

  return (
    <DashboardLayout title="Lot Allocation Requests">
      <div className="space-y-6">

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'new'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            New Request
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'my'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Requests
            {requests.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Submit new request */}
        {activeTab === 'new' && <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={20} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-800">New Lot Number Request</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Village</label>
              <input
                required
                list="village-list"
                value={form.village}
                onChange={(e) => handleVillageChange(e.target.value)}
                placeholder="e.g. Gaborone"
                className={inp}
              />
              <datalist id="village-list">
                {Object.keys(VILLAGE_CADASTRE).map(v => <option key={v} value={v} />)}
              </datalist>
              {form.village.trim().length > 2 && (
                <p className="text-xs mt-1 text-slate-400">
                  {checkingVillage ? 'Checking village...' :
                    isFirstVillage
                      ? <span className="text-amber-600 font-medium">⚠ First request for this village — enter starting plot number below</span>
                      : <>Next plot continues from <span className="font-mono text-indigo-600">{lastPlot}</span></>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Cadastre Area</label>
              <input
                value={form.cadastreNumber}
                onChange={(e) => setForm({ ...form, cadastreNumber: e.target.value })}
                placeholder="Auto-filled when village is selected"
                className={`${inp} ${form.cadastreNumber ? 'bg-indigo-50 border-indigo-200' : ''}`}
              />
              {form.cadastreNumber && (
                <p className="text-xs mt-1 text-indigo-500">✓ Auto-filled from village</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Request Type</label>
              <select
                value={form.requestType}
                onChange={(e) => setForm({ ...form, requestType: e.target.value })}
                className={inp}
              >
                {REQUEST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {(form.requestType === 'multiple_plot' || form.requestType === 'subdivision') && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Number of Plots {form.requestType === 'multiple_plot' ? '(2–5)' : '(sub-division count)'}
                </label>
                <input
                  type="number"
                  min={form.requestType === 'multiple_plot' ? 2 : 1}
                  max={form.requestType === 'multiple_plot' ? 5 : undefined}
                  required
                  value={form.plotCount}
                  onChange={(e) => setForm({ ...form, plotCount: parseInt(e.target.value) })}
                  className={inp}
                />
              </div>
            )}

            {form.requestType === 'subdivision' && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Parent Plot Number</label>
                <input
                  required
                  value={form.parentPlotNumber}
                  onChange={(e) => setForm({ ...form, parentPlotNumber: e.target.value })}
                  placeholder="e.g. Lot 5 Gaborone"
                  className={inp}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Land Board</label>
              <input
                value={form.landBoard}
                onChange={(e) => setForm({ ...form, landBoard: e.target.value })}
                placeholder="e.g. Gaborone Land Board"
                className={inp}
              />
            </div>

            {isFirstVillage && (
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Starting Plot Number <span className="text-xs font-normal text-slate-500">(first request for this village)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.manualPlotStart}
                  onChange={(e) => setForm({ ...form, manualPlotStart: e.target.value })}
                  placeholder="e.g. 1"
                  className={`${inp} border-amber-300 focus:ring-amber-400`}
                />
                <p className="text-xs mt-1 text-amber-600">Plot numbers will start from this number for {form.village}</p>
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>}

        {/* My requests list */}
        {activeTab === 'my' && <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">My Lot Requests</h3>

          {fetching ? (
            <TableSkeleton rows={3} />
          ) : requests.length === 0 ? (
            <p className="text-slate-500 text-sm">No lot requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const existingComplaint = getComplaintForRequest(req._id)
                return (
                  <div key={req._id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === req._id ? null : req._id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm text-slate-800">{req.village}</span>
                        <span className="text-xs text-slate-400 capitalize">{req.requestType.replace(/_/g, ' ')}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          req.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                          req.status === 'awaiting_payment' ? 'bg-amber-50 text-amber-700' :
                          'bg-indigo-50 text-indigo-700'
                        }`}>
                          {STATUS_LABELS[req.status] || req.status}
                        </span>
                        {existingComplaint && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            existingComplaint.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-orange-50 text-orange-700'
                          }`}>
                            Complaint {existingComplaint.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-xs">{new Date(req.createdAt).toLocaleDateString()}</span>
                        {expanded === req._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {expanded === req._id && (
                      <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
                        {/* Plot details */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {req.plots.map((plot, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                              <p className="font-mono font-bold text-indigo-700">{plot.plotNumber}</p>
                              <p className="text-slate-500">SR#: <span className="font-mono">{plot.surveyRecordNumber}</span></p>
                              <p className="text-slate-500">DSM#: <span className="font-mono">{plot.dsmNumber}</span></p>
                              <p className="text-slate-500">OS#: <span className="font-mono">{plot.osNumber}</span></p>
                              {plot.cadastreNumber && <p className="text-slate-500">Cadastre: {plot.cadastreNumber}</p>}
                            </div>
                          ))}
                        </div>

                        {req.surveyorCode && (
                          <p className="text-xs text-slate-500">Surveyor Code: <span className="font-mono font-medium">{req.surveyorCode}</span></p>
                        )}

                        {req.requestType === 'subdivision' && req.parentPlotNumber && (
                          <p className="text-xs text-slate-500">Parent plot: <span className="font-mono font-medium">{req.parentPlotNumber}</span></p>
                        )}

                        {req.rejectionReason && (
                          <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                            Rejection reason: {req.rejectionReason}
                          </p>
                        )}

                        {/* POP upload */}
                        {req.status === 'awaiting_payment' && (
                          <div className="flex items-center gap-3 pt-1">
                            <input type="file" ref={popRef} className="hidden" onChange={(e) => setPopFile(e.target.files[0])} />
                            <button
                              onClick={() => popRef.current.click()}
                              className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                            >
                              <Upload size={14} />
                              {popFile ? popFile.name : 'Select POP document'}
                            </button>
                            <button
                              onClick={() => handlePopUpload(req._id)}
                              disabled={uploadingId === req._id || !popFile}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
                            >
                              {uploadingId === req._id ? 'Uploading...' : 'Upload POP'}
                            </button>
                          </div>
                        )}

                        {req.popDocumentUrl && (
                          <p className="text-xs text-emerald-600">✓ Proof of Payment uploaded</p>
                        )}

                        {/* #9 Complaint button — only for in-progress requests */}
                        {!['approved', 'rejected'].includes(req.status) && !existingComplaint && (
                          <button
                            onClick={() => { setComplaintModal(req._id); setComplaintMsg('') }}
                            className="flex items-center gap-1.5 text-xs text-orange-600 border border-orange-200 px-3 py-2 rounded-lg hover:bg-orange-50 transition"
                          >
                            <MessageSquare size={13} /> File a Complaint
                          </button>
                        )}

                        {existingComplaint && (
                          <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs">
                            <p className="font-medium text-orange-700">Complaint filed</p>
                            <p className="text-slate-600 mt-0.5">{existingComplaint.message}</p>
                            {existingComplaint.resolution && (
                              <p className="text-emerald-700 mt-1">Resolution: {existingComplaint.resolution}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>}
      </div>

      {/* #9 Complaint modal */}
      {complaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setComplaintModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">File a Complaint</h3>
              <button onClick={() => setComplaintModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Describe the issue with your file (e.g. no status update for a long time).
              This will be sent to the file controller.
            </p>
            <textarea
              value={complaintMsg}
              onChange={(e) => setComplaintMsg(e.target.value)}
              rows={4}
              placeholder="Describe the issue..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleComplaint}
                disabled={sendingComplaint}
                className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50"
              >
                {sendingComplaint ? 'Sending...' : 'Submit Complaint'}
              </button>
              <button
                onClick={() => setComplaintModal(null)}
                className="px-4 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

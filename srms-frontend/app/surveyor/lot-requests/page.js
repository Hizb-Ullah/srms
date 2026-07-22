'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { useAuth } from '@/context/AuthContext'
import {
  createLotRequest,
  getMyLotRequests,
  uploadPop
} from '@/lib/api'
import toast from 'react-hot-toast'
import { MapPin, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'

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

export default function LotRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [fetching, setFetching] = useState(true)
  const [expanded, setExpanded] = useState(null)

  // New request form
  const [form, setForm] = useState({
    village: '', requestType: 'single_plot', plotCount: 2,
    parentPlotNumber: '', landBoard: '', cadastreNumber: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // POP upload
  const [popFile, setPopFile] = useState(null)
  const [uploadingId, setUploadingId] = useState(null)
  const popRef = useRef()

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    try {
      const res = await getMyLotRequests()
      setRequests(res.data.data)
    } catch {
      toast.error('Failed to load lot requests')
    } finally {
      setFetching(false)
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
      await createLotRequest(payload)
      toast.success('Lot request submitted successfully')
      setForm({ village: '', requestType: 'single_plot', plotCount: 2, parentPlotNumber: '', landBoard: '', cadastreNumber: '' })
      fetchRequests()
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
      fetchRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <DashboardLayout title="Lot Allocation Requests">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Submit new request */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={20} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-800">New Lot Number Request</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Village / Cadastre Area</label>
              <input
                required
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                placeholder="e.g. Gaborone West"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Request Type</label>
              <select
                value={form.requestType}
                onChange={(e) => setForm({ ...form, requestType: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  placeholder="e.g. LOT-103"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Land Board</label>
              <input
                value={form.landBoard}
                onChange={(e) => setForm({ ...form, landBoard: e.target.value })}
                placeholder="e.g. Gaborone Land Board"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Cadastre #</label>
              <input
                value={form.cadastreNumber}
                onChange={(e) => setForm({ ...form, cadastreNumber: e.target.value })}
                placeholder="Optional"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

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
        </div>

        {/* My requests list */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">My Lot Requests</h3>

          {fetching ? (
            <TableSkeleton rows={3} />
          ) : requests.length === 0 ? (
            <p className="text-slate-500 text-sm">No lot requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
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

                      {/* POP upload — only when awaiting_payment */}
                      {req.status === 'awaiting_payment' && (
                        <div className="flex items-center gap-3 pt-1">
                          <input
                            type="file"
                            ref={popRef}
                            className="hidden"
                            onChange={(e) => setPopFile(e.target.files[0])}
                          />
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

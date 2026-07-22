'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { useAuth } from '@/context/AuthContext'
import {
  getAllLotRequests,
  reviewLotRequest,
  markPaymentReceived,
  approveLotRequest,
  rejectLotRequest
} from '@/lib/api'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, CreditCard, ClipboardCheck } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

const STATUS_LABELS = {
  pending_allocator_review: 'Pending Review',
  awaiting_payment: 'Awaiting Payment',
  pop_uploaded: 'POP Uploaded',
  payment_confirmed: 'Payment Confirmed',
  approved: 'Approved',
  rejected: 'Rejected'
}

const STATUS_COLOR = {
  pending_allocator_review: 'bg-amber-50 text-amber-700',
  awaiting_payment: 'bg-sky-50 text-sky-700',
  pop_uploaded: 'bg-violet-50 text-violet-700',
  payment_confirmed: 'bg-teal-50 text-teal-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700'
}

export default function LotAllocatorPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [fetching, setFetching] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    try {
      const res = await getAllLotRequests()
      setRequests(res.data.data)
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setFetching(false)
    }
  }

  const act = async (fn, id, successMsg) => {
    setActionLoading(id)
    try {
      await fn(id)
      toast.success(successMsg)
      fetchRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return toast.error('Rejection reason is required')
    setActionLoading(id)
    try {
      await rejectLotRequest(id, { reason: rejectReason })
      toast.success('Request rejected')
      setRejectingId(null)
      setRejectReason('')
      fetchRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    } finally {
      setActionLoading(null)
    }
  }

  const pending = requests.filter((r) => !['approved', 'rejected'].includes(r.status))
  const closed  = requests.filter((r) => ['approved', 'rejected'].includes(r.status))

  const renderRequest = (req) => (
    <div key={req._id} className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(expanded === req._id ? null : req._id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-sm text-slate-800">{req.village}</span>
          <span className="text-xs text-slate-400 capitalize">{req.requestType?.replace(/_/g, ' ')}</span>
          <span className="text-xs text-slate-400">{req.requestedBy?.name || '—'}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status] || 'bg-slate-100 text-slate-600'}`}>
            {STATUS_LABELS[req.status] || req.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          <span className="text-xs">{new Date(req.createdAt).toLocaleDateString()}</span>
          {expanded === req._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded === req._id && (
        <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
          {/* Plot details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {req.plots?.map((plot, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-mono font-bold text-indigo-700">{plot.plotNumber}</p>
                <p className="text-slate-500">SR#: <span className="font-mono">{plot.surveyRecordNumber}</span></p>
                <p className="text-slate-500">DSM#: <span className="font-mono">{plot.dsmNumber}</span></p>
                <p className="text-slate-500">OS#: <span className="font-mono">{plot.osNumber}</span></p>
              </div>
            ))}
          </div>

          {req.requestType === 'subdivision' && req.parentPlotNumber && (
            <p className="text-xs text-slate-500">Parent plot: <span className="font-mono font-medium">{req.parentPlotNumber}</span></p>
          )}

          {req.surveyorCode && (
            <p className="text-xs text-slate-500">Surveyor Code: <span className="font-mono font-medium">{req.surveyorCode}</span></p>
          )}

          {req.popDocumentUrl && (
            <a
              href={req.popDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-indigo-600 underline"
            >
              View Proof of Payment
            </a>
          )}

          {req.rejectionReason && (
            <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
              Rejection reason: {req.rejectionReason}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {req.status === 'pending_allocator_review' && (
              <>
                <button
                  onClick={() => act(reviewLotRequest, req._id, 'Request reviewed — payment opened')}
                  disabled={actionLoading === req._id}
                  className="flex items-center gap-1.5 bg-sky-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-sky-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <ClipboardCheck size={14} /> Review & Open Payment
                </button>
                <button
                  onClick={() => setRejectingId(req._id)}
                  className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-100 transition"
                >
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}

            {req.status === 'pop_uploaded' && (
              <>
                <button
                  onClick={() => act(markPaymentReceived, req._id, 'Payment confirmed')}
                  disabled={actionLoading === req._id}
                  className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-teal-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <CreditCard size={14} /> Confirm Payment
                </button>
                <button
                  onClick={() => setRejectingId(req._id)}
                  className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-100 transition"
                >
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}

            {req.status === 'payment_confirmed' && (
              <>
                <button
                  onClick={() => act(approveLotRequest, req._id, 'Request approved — Accounts office notified')}
                  disabled={actionLoading === req._id}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Final Approval
                </button>
                <button
                  onClick={() => setRejectingId(req._id)}
                  className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-100 transition"
                >
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
          </div>

          {/* Inline reject form */}
          {rejectingId === req._id && (
            <div className="flex gap-2 pt-1">
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (required)"
                className="flex-1 border border-rose-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <button
                onClick={() => handleReject(req._id)}
                disabled={actionLoading === req._id}
                className="bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-700 transition disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectReason('') }}
                className="border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <DashboardLayout title="Lot Allocation — DSM">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Active Requests
            {pending.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </h3>

          {fetching ? (
            <TableSkeleton rows={4} />
          ) : pending.length === 0 ? (
            <p className="text-slate-500 text-sm">No active requests.</p>
          ) : (
            <div className="space-y-3">{pending.map(renderRequest)}</div>
          )}
        </div>

        {closed.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Closed Requests</h3>
            <div className="space-y-3">{closed.map(renderRequest)}</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

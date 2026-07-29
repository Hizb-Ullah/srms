'use client'

import { useState, useEffect } from 'react'
import { getSectionQueue, getSectionCompleted, takeSectionAction, sendSectionComment } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Inbox, CheckCircle2, ChevronDown, ChevronUp, MessageSquare, X, CheckCircle, XCircle
} from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

// Shared dashboard for the four DSM file-section sub-roles (Registration &
// Reservation / Capturing / Examination / Approval). Each section shows the
// files the Controller sent it that aren't yet actioned, lets the officer
// take their action (with a Pass/Fail choice for Examination & Approval),
// and lets them send a comment to the surveyor about the file.
export default function FileSectionBoard({ section, title, actionLabel, hasOutcome }) {
  const [queue, setQueue] = useState([])
  const [completed, setCompleted] = useState([])
  const [fetching, setFetching] = useState(true)
  const [tab, setTab] = useState('queue')
  const [expanded, setExpanded] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const [commentFor, setCommentFor] = useState(null)
  const [commentMsg, setCommentMsg] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  useEffect(() => { fetchAll() }, [section])

  const fetchAll = async () => {
    setFetching(true)
    try {
      const [qRes, cRes] = await Promise.all([getSectionQueue(section), getSectionCompleted(section)])
      setQueue(qRes.data.data)
      setCompleted(cRes.data.data)
    } catch {
      toast.error('Failed to load files')
    } finally {
      setFetching(false)
    }
  }

  const doAction = async (id, outcome) => {
    setActionLoading(id)
    try {
      const res = await takeSectionAction(section, id, hasOutcome ? { outcome } : {})
      toast.success(res.data.message)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendComment = async () => {
    if (!commentMsg.trim()) return toast.error('Comment message is required')
    setSendingComment(true)
    try {
      await sendSectionComment(section, commentFor, { message: commentMsg })
      toast.success('Comment sent to surveyor')
      setCommentFor(null)
      setCommentMsg('')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send comment')
    } finally {
      setSendingComment(false)
    }
  }

  const renderFile = (rec, { isQueue }) => (
    <div key={rec._id} className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(expanded === rec._id ? null : rec._id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-sm text-slate-800">{rec.village}</span>
          <span className="text-xs text-slate-400">{rec.requestedBy?.name || '—'}</span>
          {!isQueue && hasOutcome && rec[section === 'examination' ? 'examinationOutcome' : 'approvalOutcome'] && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              rec[section === 'examination' ? 'examinationOutcome' : 'approvalOutcome'] === 'pass'
                ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {rec[section === 'examination' ? 'examinationOutcome' : 'approvalOutcome'] === 'pass' ? 'Passed' : 'Failed'}
            </span>
          )}
          {!isQueue && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              Returned to Controller
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          <span className="text-xs">{rec.controllerStageUpdatedAt ? new Date(rec.controllerStageUpdatedAt).toLocaleDateString() : ''}</span>
          {expanded === rec._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded === rec._id && (
        <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {rec.plots?.map((plot, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                <p className="font-mono font-bold text-indigo-700">{plot.plotNumber}</p>
                <p className="text-slate-500">SR#: <span className="font-mono">{plot.surveyRecordNumber}</span></p>
                <p className="text-slate-500">DSM#: <span className="font-mono">{plot.dsmNumber}</span></p>
                <p className="text-slate-500">OS#: <span className="font-mono">{plot.osNumber}</span></p>
              </div>
            ))}
          </div>

          {rec.requestedBy?.surveyorCode && (
            <p className="text-xs text-slate-500">Surveyor Code: <span className="font-mono font-medium">{rec.requestedBy.surveyorCode}</span></p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {isQueue && !hasOutcome && (
              <button
                onClick={() => doAction(rec._id)}
                disabled={actionLoading === rec._id}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> {actionLabel}
              </button>
            )}

            {isQueue && hasOutcome && (
              <>
                <button
                  onClick={() => doAction(rec._id, 'pass')}
                  disabled={actionLoading === rec._id}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Pass
                </button>
                <button
                  onClick={() => doAction(rec._id, 'fail')}
                  disabled={actionLoading === rec._id}
                  className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <XCircle size={14} /> Fail
                </button>
              </>
            )}

            <button
              onClick={() => { setCommentFor(rec._id); setCommentMsg('') }}
              className="flex items-center gap-1.5 border border-orange-300 text-orange-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-50 transition"
            >
              <MessageSquare size={14} /> Send Surveyor Comment
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setTab('queue')}
          className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
            tab === 'queue' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-amber-50 text-amber-700'
          }`}
        >
          <Inbox size={24} />
          <div>
            <p className="text-xs font-medium opacity-75">Awaiting Action</p>
            <p className="text-3xl font-bold">{fetching ? '—' : queue.length}</p>
          </div>
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
            tab === 'completed' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-emerald-50 text-emerald-700'
          }`}
        >
          <CheckCircle2 size={24} />
          <div>
            <p className="text-xs font-medium opacity-75">Completed (with Controller)</p>
            <p className="text-3xl font-bold">{fetching ? '—' : completed.length}</p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          {tab === 'queue' ? `Files Received from Controller (not yet actioned) — ${title}` : `Completed — ${title}`}
        </h3>
        {fetching ? (
          <TableSkeleton rows={3} />
        ) : tab === 'queue' ? (
          queue.length === 0
            ? <p className="text-slate-500 text-sm">No files waiting in this section.</p>
            : <div className="space-y-3">{queue.map(rec => renderFile(rec, { isQueue: true }))}</div>
        ) : (
          completed.length === 0
            ? <p className="text-slate-500 text-sm">No completed files yet.</p>
            : <div className="space-y-3">{completed.map(rec => renderFile(rec, { isQueue: false }))}</div>
        )}
      </div>

      {commentFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCommentFor(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Send Surveyor Comment</h3>
              <button onClick={() => setCommentFor(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              This comment will be sent to the surveyor who owns this file.
            </p>
            <textarea
              value={commentMsg}
              onChange={(e) => setCommentMsg(e.target.value)}
              rows={4}
              placeholder="Write your comment..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSendComment}
                disabled={sendingComment}
                className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50"
              >
                {sendingComment ? 'Sending...' : 'Send Comment'}
              </button>
              <button
                onClick={() => setCommentFor(null)}
                className="px-4 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

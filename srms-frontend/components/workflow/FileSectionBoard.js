'use client'

import { useState, useEffect, useRef } from 'react'
import { getSectionQueue, getMySectionQueue, acceptSectionJob, getSectionCompleted, takeSectionAction, sendSectionComment } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Inbox, CheckCircle2, ChevronDown, ChevronUp, MessageSquare, X, CheckCircle, XCircle, Hand, Paperclip
} from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

// Shared dashboard for the four DSM file-section sub-roles (Registration &
// Reservation / Capturing / Examination / Approval). Files the Controller
// sends land in a shared, unclaimed queue — any officer in the section can
// click "Accept Job" to claim one, which moves it to their own "Awaiting
// Action" (no one else can act on it once claimed). They then take their
// action (with a Pass/Fail choice for Examination & Approval), or send the
// surveyor a comment, optionally with an attached file.
export default function FileSectionBoard({ section, title, actionLabel, hasOutcome }) {
  const [available, setAvailable] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [completed, setCompleted] = useState([])
  const [fetching, setFetching] = useState(true)
  const [tab, setTab] = useState('available')
  const [expanded, setExpanded] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const [commentFor, setCommentFor] = useState(null)
  const [commentMsg, setCommentMsg] = useState('')
  const [commentFile, setCommentFile] = useState(null)
  const [sendingComment, setSendingComment] = useState(false)
  const fileRef = useRef()

  useEffect(() => { fetchAll() }, [section])

  const fetchAll = async () => {
    setFetching(true)
    try {
      const [aRes, mRes, cRes] = await Promise.all([
        getSectionQueue(section),
        getMySectionQueue(section),
        getSectionCompleted(section)
      ])
      setAvailable(aRes.data.data)
      setMyJobs(mRes.data.data)
      setCompleted(cRes.data.data)
    } catch {
      toast.error('Failed to load files')
    } finally {
      setFetching(false)
    }
  }

  const doAccept = async (id) => {
    setActionLoading(id)
    try {
      await acceptSectionJob(section, id)
      toast.success('Job accepted — moved to your Awaiting Action')
      setTab('mine')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
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
      const fd = new FormData()
      fd.append('message', commentMsg)
      if (commentFile) fd.append('file', commentFile)
      await sendSectionComment(section, commentFor, fd)
      toast.success('Comment sent to surveyor')
      setCommentFor(null)
      setCommentMsg('')
      setCommentFile(null)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send comment')
    } finally {
      setSendingComment(false)
    }
  }

  const renderFile = (rec, { view }) => (
    <div key={rec._id} className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(expanded === rec._id ? null : rec._id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-sm text-slate-800">{rec.village}</span>
          <span className="text-xs text-slate-400">{rec.requestedBy?.name || '—'}</span>
          {view === 'completed' && hasOutcome && rec[section === 'examination' ? 'examinationOutcome' : 'approvalOutcome'] && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              rec[section === 'examination' ? 'examinationOutcome' : 'approvalOutcome'] === 'pass'
                ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {rec[section === 'examination' ? 'examinationOutcome' : 'approvalOutcome'] === 'pass' ? 'Passed' : 'Failed'}
            </span>
          )}
          {view === 'completed' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              Returned to Controller
            </span>
          )}
          {view === 'mine' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Accepted by you
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

          {rec.controllerComments?.filter(c => c.stage === section).length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs space-y-1">
              <p className="font-medium text-orange-700">Comments sent to surveyor</p>
              {rec.controllerComments.filter(c => c.stage === section).map((c, i) => (
                <p key={i} className="text-slate-600">
                  {c.message}
                  {c.fileUrl && (
                    <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline ml-2">
                      {c.fileName || 'Attachment'}
                    </a>
                  )}
                  <span className="text-slate-400"> · {new Date(c.sentAt).toLocaleDateString()}</span>
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {view === 'available' && (
              <button
                onClick={() => doAccept(rec._id)}
                disabled={actionLoading === rec._id}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                <Hand size={14} /> Accept Job
              </button>
            )}

            {view === 'mine' && !hasOutcome && (
              <button
                onClick={() => doAction(rec._id)}
                disabled={actionLoading === rec._id}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> {actionLabel}
              </button>
            )}

            {view === 'mine' && hasOutcome && (
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
              onClick={() => { setCommentFor(rec._id); setCommentMsg(''); setCommentFile(null) }}
              className="flex items-center gap-1.5 border border-orange-300 text-orange-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-50 transition"
            >
              <MessageSquare size={14} /> Send Surveyor Comment
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const TABS = [
    { key: 'available', label: 'Available', list: available, color: 'bg-amber-50 text-amber-700', icon: Inbox },
    { key: 'mine', label: 'My Awaiting Action', list: myJobs, color: 'bg-indigo-50 text-indigo-700', icon: Hand },
    { key: 'completed', label: 'Completed (with Controller)', list: completed, color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
              tab === t.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : `border-transparent ${t.color}`
            }`}
          >
            <t.icon size={24} />
            <div>
              <p className="text-xs font-medium opacity-75">{t.label}</p>
              <p className="text-3xl font-bold">{fetching ? '—' : t.list.length}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          {tab === 'available' ? `Received from Controller — Available to Accept — ${title}`
            : tab === 'mine' ? `My Awaiting Action — ${title}`
            : `Completed — ${title}`}
        </h3>
        {fetching ? (
          <TableSkeleton rows={3} />
        ) : tab === 'available' ? (
          available.length === 0
            ? <p className="text-slate-500 text-sm">No unclaimed files waiting in this section.</p>
            : <div className="space-y-3">{available.map(rec => renderFile(rec, { view: 'available' }))}</div>
        ) : tab === 'mine' ? (
          myJobs.length === 0
            ? <p className="text-slate-500 text-sm">You haven&apos;t accepted any jobs yet — check the Available tab.</p>
            : <div className="space-y-3">{myJobs.map(rec => renderFile(rec, { view: 'mine' }))}</div>
        ) : (
          completed.length === 0
            ? <p className="text-slate-500 text-sm">No completed files yet.</p>
            : <div className="space-y-3">{completed.map(rec => renderFile(rec, { view: 'completed' }))}</div>
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
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              onChange={(e) => setCommentFile(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="mt-3 flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
            >
              <Paperclip size={14} /> {commentFile ? commentFile.name : 'Attach a file (optional)'}
            </button>
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

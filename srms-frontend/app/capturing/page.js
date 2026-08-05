'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/app/dashboard-layout'
import FileSectionBoard from '@/components/workflow/FileSectionBoard'
import { getCapturingScratchQueue, getCapturingScratchCompleted, reviewScratchCapturing, getCapturingFramingDataQueue, getCapturingFramingDataCompleted, reviewFramingDataCapturing } from '@/lib/api'
import toast from 'react-hot-toast'
import { FileUp, CheckCircle, XCircle, Upload, Hash } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

// The scratch queue/review UI for File Capturing — files the Controller
// sent them to run a data consistency "Scratch" check on: mark Passed/Failed
// with an uploaded report, which then goes back to Controller + surveyor.
function ScratchCapturingBoard() {
  const [queue, setQueue] = useState([])
  const [completed, setCompleted] = useState([])
  const [tab, setTab] = useState('queue')
  const [fetching, setFetching] = useState(true)
  const [reviewFor, setReviewFor] = useState(null)
  const [reportFile, setReportFile] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setFetching(true)
    try {
      const [qRes, cRes] = await Promise.all([getCapturingScratchQueue(), getCapturingScratchCompleted()])
      setQueue(qRes.data.data)
      setCompleted(cRes.data.data)
    } catch {
      toast.error('Failed to load scratch requests')
    } finally {
      setFetching(false)
    }
  }

  const handleReview = async (id, outcome) => {
    setActionLoading(id)
    try {
      const fd = new FormData()
      fd.append('outcome', outcome)
      if (reportFile) fd.append('report', reportFile)
      await reviewScratchCapturing(id, fd)
      toast.success(`Marked as ${outcome} — forwarded to surveyor`)
      setReviewFor(null)
      setReportFile(null)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setTab('queue')}
          className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
            tab === 'queue' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-amber-50 text-amber-700'
          }`}
        >
          <FileUp size={24} />
          <div>
            <p className="text-xs font-medium opacity-75">Awaiting Review</p>
            <p className="text-3xl font-bold">{fetching ? '—' : queue.length}</p>
          </div>
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
            tab === 'completed' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-emerald-50 text-emerald-700'
          }`}
        >
          <CheckCircle size={24} />
          <div>
            <p className="text-xs font-medium opacity-75">Completed</p>
            <p className="text-3xl font-bold">{fetching ? '—' : completed.length}</p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          {tab === 'queue' ? 'Received from Controller — Not Yet Reviewed' : 'Completed Scratch Reviews'}
        </h3>
        {fetching ? (
          <TableSkeleton rows={3} />
        ) : (tab === 'queue' ? queue : completed).length === 0 ? (
          <p className="text-slate-500 text-sm">No records here.</p>
        ) : (
          <div className="space-y-3">
            {(tab === 'queue' ? queue : completed).map(s => (
              <div key={s._id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-sm text-slate-800">{s.fileName}</span>
                    <span className="text-xs text-slate-400">{s.requestedBy?.name || '—'}</span>
                    <span className="text-xs text-slate-400 capitalize">
                      {s.linkType === 'general_plan' ? 'General Plan' : 'Parent'}: {s.referenceSrNumber} / {s.referenceDsmNumber}
                    </span>
                    {s.capturingOutcome && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.capturingOutcome === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {s.capturingOutcome === 'passed' ? 'Passed' : 'Failed'}
                      </span>
                    )}
                  </div>
                  <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 underline shrink-0">
                    View File
                  </a>
                </div>

                {s.reportUrl && (
                  <a href={s.reportUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-indigo-600 underline mt-2">
                    View Uploaded Report
                  </a>
                )}

                {tab === 'queue' && (
                  reviewFor === s._id ? (
                    <div className="flex flex-wrap gap-2 items-center mt-3">
                      <input
                        type="file"
                        ref={fileRef}
                        className="hidden"
                        onChange={(e) => setReportFile(e.target.files[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current.click()}
                        className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                      >
                        <Upload size={14} /> {reportFile ? reportFile.name : 'Attach report (optional)'}
                      </button>
                      <button
                        onClick={() => handleReview(s._id, 'passed')}
                        disabled={actionLoading === s._id}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> Pass
                      </button>
                      <button
                        onClick={() => handleReview(s._id, 'failed')}
                        disabled={actionLoading === s._id}
                        className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-700 transition disabled:opacity-50"
                      >
                        <XCircle size={14} /> Fail
                      </button>
                      <button
                        onClick={() => { setReviewFor(null); setReportFile(null) }}
                        className="border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReviewFor(s._id); setReportFile(null) }}
                      className="flex items-center gap-1.5 border border-indigo-300 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-50 transition mt-3"
                    >
                      <FileUp size={14} /> Review
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// The framing data queue/review UI for File Capturing — requests the
// Controller sent them to check: mark Passed/Failed with an optional report,
// which then goes back to Controller + surveyor. Mirrors Scratch exactly.
function FramingDataCapturingBoard() {
  const [queue, setQueue] = useState([])
  const [completed, setCompleted] = useState([])
  const [tab, setTab] = useState('queue')
  const [fetching, setFetching] = useState(true)
  const [reviewFor, setReviewFor] = useState(null)
  const [reportFile, setReportFile] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setFetching(true)
    try {
      const [qRes, cRes] = await Promise.all([getCapturingFramingDataQueue(), getCapturingFramingDataCompleted()])
      setQueue(qRes.data.data)
      setCompleted(cRes.data.data)
    } catch {
      toast.error('Failed to load framing data requests')
    } finally {
      setFetching(false)
    }
  }

  const handleReview = async (id, outcome) => {
    setActionLoading(id)
    try {
      const fd = new FormData()
      fd.append('outcome', outcome)
      if (reportFile) fd.append('report', reportFile)
      await reviewFramingDataCapturing(id, fd)
      toast.success(`Marked as ${outcome} — forwarded to surveyor`)
      setReviewFor(null)
      setReportFile(null)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setTab('queue')}
          className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
            tab === 'queue' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-amber-50 text-amber-700'
          }`}
        >
          <Hash size={24} />
          <div>
            <p className="text-xs font-medium opacity-75">Awaiting Review</p>
            <p className="text-3xl font-bold">{fetching ? '—' : queue.length}</p>
          </div>
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
            tab === 'completed' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-emerald-50 text-emerald-700'
          }`}
        >
          <CheckCircle size={24} />
          <div>
            <p className="text-xs font-medium opacity-75">Completed</p>
            <p className="text-3xl font-bold">{fetching ? '—' : completed.length}</p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          {tab === 'queue' ? 'Received from Controller — Not Yet Reviewed' : 'Completed Framing Data Reviews'}
        </h3>
        {fetching ? (
          <TableSkeleton rows={3} />
        ) : (tab === 'queue' ? queue : completed).length === 0 ? (
          <p className="text-slate-500 text-sm">No records here.</p>
        ) : (
          <div className="space-y-3">
            {(tab === 'queue' ? queue : completed).map(f => (
              <div key={f._id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-sm text-slate-800">{f.lotNumber}</span>
                    <span className="text-xs text-slate-400">{f.village}</span>
                    <span className="text-xs text-slate-400">{f.requestedBy?.name || '—'}</span>
                    {f.capturingOutcome && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        f.capturingOutcome === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {f.capturingOutcome === 'passed' ? 'Passed' : 'Failed'}
                      </span>
                    )}
                  </div>
                </div>

                {f.reportUrl && (
                  <a href={f.reportUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-indigo-600 underline mt-2">
                    View Uploaded Report
                  </a>
                )}

                {tab === 'queue' && (
                  reviewFor === f._id ? (
                    <div className="flex flex-wrap gap-2 items-center mt-3">
                      <input
                        type="file"
                        ref={fileRef}
                        className="hidden"
                        onChange={(e) => setReportFile(e.target.files[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current.click()}
                        className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                      >
                        <Upload size={14} /> {reportFile ? reportFile.name : 'Attach report (optional)'}
                      </button>
                      <button
                        onClick={() => handleReview(f._id, 'passed')}
                        disabled={actionLoading === f._id}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> Pass
                      </button>
                      <button
                        onClick={() => handleReview(f._id, 'failed')}
                        disabled={actionLoading === f._id}
                        className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-700 transition disabled:opacity-50"
                      >
                        <XCircle size={14} /> Fail
                      </button>
                      <button
                        onClick={() => { setReviewFor(null); setReportFile(null) }}
                        className="border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReviewFor(f._id); setReportFile(null) }}
                      className="flex items-center gap-1.5 border border-indigo-300 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-50 transition mt-3"
                    >
                      <FileUp size={14} /> Review
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CapturingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'files'

  return (
    <DashboardLayout title="File Capturing">
      <div className="space-y-4">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => router.push('/capturing')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === 'files' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            File Capturing
          </button>
          <button
            onClick={() => router.push('/capturing?tab=scratch')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === 'scratch' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Scratch Files
          </button>
          <button
            onClick={() => router.push('/capturing?tab=framing-data')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === 'framing-data' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Framing Data
          </button>
        </div>

        {tab === 'scratch' ? (
          <ScratchCapturingBoard />
        ) : tab === 'framing-data' ? (
          <FramingDataCapturingBoard />
        ) : (
          <FileSectionBoard
            section="capturing"
            title="Capturing"
            actionLabel="Capture File"
            hasOutcome={false}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default function CapturingPage() {
  return (
    <Suspense fallback={null}>
      <CapturingContent />
    </Suspense>
  )
}

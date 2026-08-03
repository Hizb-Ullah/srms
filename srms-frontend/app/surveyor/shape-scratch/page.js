'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { submitShapeScratch, getMyShapeScratchRequests } from '@/lib/api'
import toast from 'react-hot-toast'
import { FileUp, ChevronDown, ChevronUp, Upload } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

// Per client: goes directly to the File Controller (not RMU), Controller
// sends to Capturing, Capturing marks it and the result automatically comes
// back to the surveyor too.
const STATUS_LABELS = {
  received_from_surveyor: 'Received by Controller',
  sent_to_capturing: 'In Progress (with Capturing)',
  forwarded_to_surveyor: 'Forwarded to You'
}
const STATUS_COLOR = {
  received_from_surveyor: 'bg-sky-50 text-sky-700',
  sent_to_capturing: 'bg-amber-50 text-amber-700',
  forwarded_to_surveyor: 'bg-emerald-50 text-emerald-700'
}

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default function ShapeScratchPage() {
  const [records, setRecords] = useState([])
  const [fetching, setFetching] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const [linkType, setLinkType] = useState('parent')
  const [referenceSrNumber, setReferenceSrNumber] = useState('')
  const [referenceDsmNumber, setReferenceDsmNumber] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const res = await getMyShapeScratchRequests()
      setRecords(res.data.data)
    } catch {
      toast.error('Failed to load scratch requests')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!referenceSrNumber.trim() || !referenceDsmNumber.trim()) return toast.error('Reference SR# and DSM# are required')
    if (!file) return toast.error('Select a shape file first')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('linkType', linkType)
      fd.append('referenceSrNumber', referenceSrNumber.trim())
      fd.append('referenceDsmNumber', referenceDsmNumber.trim())
      fd.append('file', file)
      await submitShapeScratch(fd)
      toast.success('Shape file submitted for scratch check')
      setReferenceSrNumber('')
      setReferenceDsmNumber('')
      setFile(null)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="Request Shape File Scratch">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileUp size={20} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-800">Request Shape File Scratch</h2>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Before submitting a full layout, send DSM your surveyed shape file to run a
            data consistency check ("Scratch") against an existing Parent plot or General
            Plan record. This goes straight to the File Controller. You'll get a pass/fail
            result with a report here once Capturing has reviewed it.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Checking Against</label>
              <select value={linkType} onChange={(e) => setLinkType(e.target.value)} className={inp}>
                <option value="parent">Parent Information</option>
                <option value="general_plan">General Plan (GP) Information</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Enter SR#</label>
                <input
                  required
                  value={referenceSrNumber}
                  onChange={(e) => setReferenceSrNumber(e.target.value)}
                  placeholder="e.g. S10/2026"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Enter DSM#</label>
                <input
                  required
                  value={referenceDsmNumber}
                  onChange={(e) => setReferenceDsmNumber(e.target.value)}
                  placeholder="e.g. 114/2026"
                  className={inp}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Shape File</label>
              <input
                type="file"
                ref={fileRef}
                accept=".zip,.shp,.dbf,.shx,.prj"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                <Upload size={14} /> {file ? file.name : 'Select shape file (.zip, .shp, .dbf, .shx, .prj)'}
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit for Scratch Check'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">My Scratch Requests</h3>
          {fetching ? (
            <TableSkeleton rows={3} />
          ) : records.length === 0 ? (
            <p className="text-slate-500 text-sm">No scratch requests yet.</p>
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r._id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-left"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-sm text-slate-800">{r.fileName}</span>
                      <span className="text-xs text-slate-400 capitalize">{r.linkType === 'general_plan' ? 'General Plan' : 'Parent'}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      {r.capturingOutcome && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.capturingOutcome === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {r.capturingOutcome === 'passed' ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 shrink-0">
                      <span className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                      {expanded === r._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  {expanded === r._id && (
                    <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-2">
                      <p className="text-xs text-slate-500">
                        Reference SR#: <span className="font-mono font-medium">{r.referenceSrNumber}</span>
                        {' · '}DSM#: <span className="font-mono font-medium">{r.referenceDsmNumber}</span>
                      </p>
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-indigo-600 underline">
                        View Uploaded Shape File
                      </a>
                      {r.reportUrl && (
                        <a href={r.reportUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-indigo-600 underline ml-3">
                          View Capturing Report
                        </a>
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

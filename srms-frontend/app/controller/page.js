'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/app/dashboard-layout'
import { getControllerFiles, moveControllerStage, returnFileToRmu, getControllerScratchRequests, sendScratchToCapturing } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Inbox, Send, FileCheck, FileSearch, CheckCircle,
  ChevronDown, ChevronUp, RotateCcw, FolderOpen, FileUp
} from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

// Per client's Controller schema:
// Receive from RMU (not yet assigned) → Registration & Reservation →
// Capturing → Examination → Approval, send/receive at each stage,
// Return to RMU possible at every action point.
const STAGE_LABELS = {
  received_unassigned: 'Received from RMU (not yet assigned)',
  sent_to_registration: 'Sent to Registration & Reservation',
  received_from_registration: 'Received from Registration',
  sent_to_capturing: 'Sent to Capturing',
  received_from_capturing: 'Received from Capturing',
  sent_to_examination: 'Sent to Examination',
  received_from_examination: 'Received from Examination',
  sent_to_approval: 'Sent to Approval',
  received_from_approval: 'Received from Approval',
  returned_to_rmu: 'Returned to RMU'
}

const STAGE_COLOR = {
  received_unassigned: 'bg-amber-50 text-amber-700',
  sent_to_registration: 'bg-sky-50 text-sky-700',
  received_from_registration: 'bg-sky-100 text-sky-800',
  sent_to_capturing: 'bg-violet-50 text-violet-700',
  received_from_capturing: 'bg-violet-100 text-violet-800',
  sent_to_examination: 'bg-teal-50 text-teal-700',
  received_from_examination: 'bg-teal-100 text-teal-800',
  sent_to_approval: 'bg-indigo-50 text-indigo-700',
  received_from_approval: 'bg-indigo-100 text-indigo-800',
  returned_to_rmu: 'bg-emerald-50 text-emerald-700'
}

// Section tabs and which stages belong to them
const SECTIONS = [
  { key: 'unassigned',   label: 'Received from RMU',           stages: ['received_unassigned'] },
  { key: 'registration', label: 'File Registration & Reservation', stages: ['sent_to_registration', 'received_from_registration'] },
  { key: 'capturing',    label: 'File Capturing',              stages: ['sent_to_capturing', 'received_from_capturing'] },
  { key: 'examination',  label: 'File Examination',            stages: ['sent_to_examination', 'received_from_examination'] },
  { key: 'approval',     label: 'Approval',                    stages: ['sent_to_approval', 'received_from_approval'] },
  { key: 'returned',     label: 'Returned to RMU',             stages: ['returned_to_rmu'] },
]

// Available actions per current stage: [label, targetStage, icon]
const NEXT_ACTIONS = {
  received_unassigned:        [{ label: 'Send to Registration & Reservation', stage: 'sent_to_registration', icon: Send }],
  sent_to_registration:       [{ label: 'Received from Registration', stage: 'received_from_registration', icon: Inbox }],
  received_from_registration: [{ label: 'Send to Capturing', stage: 'sent_to_capturing', icon: Send }],
  sent_to_capturing:          [{ label: 'Received from Capturing', stage: 'received_from_capturing', icon: Inbox }],
  received_from_capturing:    [{ label: 'Send to Examination', stage: 'sent_to_examination', icon: Send }],
  sent_to_examination:        [{ label: 'Received from Examination', stage: 'received_from_examination', icon: Inbox }],
  received_from_examination:  [{ label: 'Send to Approval', stage: 'sent_to_approval', icon: Send }],
  sent_to_approval:           [{ label: 'Received from Approval', stage: 'received_from_approval', icon: Inbox }],
  received_from_approval:     []
}

// Stages at which Return to RMU is allowed (every "received" action point)
const RETURNABLE = [
  'received_unassigned',
  'received_from_registration',
  'received_from_capturing',
  'received_from_examination',
  'received_from_approval'
]

function ControllerWorkflowContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const section = searchParams.get('section') || 'unassigned'

  const [files, setFiles] = useState([])
  const [scratchRequests, setScratchRequests] = useState([])
  const [fetching, setFetching] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [returnFor, setReturnFor] = useState(null)

  useEffect(() => { fetchFiles() }, [])

  const fetchFiles = async () => {
    try {
      const res = await getControllerFiles()
      setFiles(res.data.data)
      const scRes = await getControllerScratchRequests()
      setScratchRequests(scRes.data.data)
    } catch {
      toast.error('Failed to load controller files')
    } finally {
      setFetching(false)
    }
  }

  const handleSendToCapturing = async (id) => {
    setActionLoading(id)
    try {
      await sendScratchToCapturing(id)
      toast.success('Sent to Capturing')
      fetchFiles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const doMove = async (id, stage, label) => {
    setActionLoading(id)
    try {
      await moveControllerStage(id, { stage })
      toast.success(label)
      fetchFiles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const doReturn = async (id, outcome) => {
    setActionLoading(id)
    try {
      await returnFileToRmu(id, { outcome })
      toast.success('File returned to RMU')
      setReturnFor(null)
      fetchFiles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const counts = SECTIONS.reduce((acc, sec) => {
    acc[sec.key] = files.filter(f => sec.stages.includes(f.controllerStage)).length
    return acc
  }, {})

  const visible = files.filter(f => (SECTIONS.find(s => s.key === section)?.stages || []).includes(f.controllerStage))

  const renderFile = (rec) => (
    <div key={rec._id} className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(expanded === rec._id ? null : rec._id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-sm text-slate-800">{rec.village}</span>
          <span className="text-xs text-slate-400">{rec.requestedBy?.name || '—'}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_COLOR[rec.controllerStage]}`}>
            {STAGE_LABELS[rec.controllerStage]}
          </span>
          {rec.rmuOutcome && rec.controllerStage === 'returned_to_rmu' && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              rec.rmuOutcome === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {rec.rmuOutcome === 'approved' ? 'Approved' : 'Not Approved'}
            </span>
          )}
          {rec.examinationOutcome && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              rec.examinationOutcome === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              Examination {rec.examinationOutcome === 'pass' ? 'Passed' : 'Failed'}
            </span>
          )}
          {rec.approvalOutcome && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              rec.approvalOutcome === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              Approval {rec.approvalOutcome === 'pass' ? 'Passed' : 'Failed'}
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

          {rec.paymentReceiptNumber && (
            <p className="text-xs text-emerald-700">Paid · Receipt <span className="font-mono font-medium">{rec.paymentReceiptNumber}</span></p>
          )}

          {rec.controllerComments?.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs space-y-1">
              <p className="font-medium text-orange-700">Comments sent to surveyor</p>
              {rec.controllerComments.map((c, i) => (
                <p key={i} className="text-slate-600">
                  <span className="capitalize font-medium">{c.stage}</span>: {c.message} <span className="text-slate-400">· {new Date(c.sentAt).toLocaleDateString()}</span>
                </p>
              ))}
            </div>
          )}

          {/* Stage history */}
          {rec.controllerHistory?.length > 0 && (
            <div className="text-xs text-slate-500 space-y-0.5">
              <p className="font-medium text-slate-600">History</p>
              {rec.controllerHistory.map((h, i) => (
                <p key={i}>{STAGE_LABELS[h.stage] || h.stage} · {new Date(h.at).toLocaleString()}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(NEXT_ACTIONS[rec.controllerStage] || []).map(({ label, stage, icon: Icon }) => (
              <button
                key={stage}
                onClick={() => doMove(rec._id, stage, label)}
                disabled={actionLoading === rec._id}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                <Icon size={14} /> {label}
              </button>
            ))}

            {RETURNABLE.includes(rec.controllerStage) && (
              returnFor === rec._id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => doReturn(rec._id, 'approved')}
                    disabled={actionLoading === rec._id}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <CheckCircle size={14} /> Return as Approved
                  </button>
                  <button
                    onClick={() => doReturn(rec._id, 'not_approved')}
                    disabled={actionLoading === rec._id}
                    className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    <RotateCcw size={14} /> Return as Not Approved
                  </button>
                  <button
                    onClick={() => setReturnFor(null)}
                    className="border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReturnFor(rec._id)}
                  className="flex items-center gap-1.5 border border-amber-300 text-amber-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-50 transition"
                >
                  <RotateCcw size={14} /> Return to RMU
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )

  const cards = [
    { key: 'unassigned',   label: 'From RMU (Unassigned)', icon: Inbox,      color: 'bg-amber-50 text-amber-700' },
    { key: 'registration', label: 'Registration',          icon: FolderOpen, color: 'bg-sky-50 text-sky-700' },
    { key: 'capturing',    label: 'Capturing',             icon: FileCheck,  color: 'bg-violet-50 text-violet-700' },
    { key: 'examination',  label: 'Examination',           icon: FileSearch, color: 'bg-teal-50 text-teal-700' },
    { key: 'approval',     label: 'Approval',              icon: CheckCircle,color: 'bg-indigo-50 text-indigo-700' },
  ]

  return (
    <DashboardLayout title="Controller — File Workflow">
      <div className="space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cards.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => router.push(`/controller?section=${key}`)}
              className={`rounded-xl p-4 flex items-center gap-3 ${color} border-2 text-left transition hover:scale-[1.02] active:scale-[0.98] ${
                section === key ? 'border-current shadow-md' : 'border-transparent'
              }`}
            >
              <Icon size={20} />
              <div>
                <p className="text-xs font-medium opacity-75">{label}</p>
                <p className="text-2xl font-bold">{fetching ? '—' : counts[key]}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {SECTIONS.map(sec => (
            <button
              key={sec.key}
              onClick={() => router.push(`/controller?section=${sec.key}`)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                section === sec.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {sec.label}
              {counts[sec.key] > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {counts[sec.key]}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => router.push('/controller?section=scratch')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              section === 'scratch' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Shape File Scratch
            {scratchRequests.filter(s => s.status === 'received_from_surveyor').length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {scratchRequests.filter(s => s.status === 'received_from_surveyor').length}
              </span>
            )}
          </button>
        </div>

        {section === 'scratch' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Shape File Scratch Requests</h3>
            {fetching ? (
              <TableSkeleton rows={3} />
            ) : scratchRequests.length === 0 ? (
              <p className="text-slate-500 text-sm">No shape file scratch requests yet.</p>
            ) : (
              <div className="space-y-3">
                {scratchRequests.map(s => (
                  <div key={s._id} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-sm text-slate-800">{s.fileName}</span>
                        <span className="text-xs text-slate-400">{s.requestedBy?.name || '—'}</span>
                        <span className="text-xs text-slate-400 capitalize">
                          {s.linkType === 'general_plan' ? 'General Plan' : 'Parent'}: {s.referenceSrNumber} / {s.referenceDsmNumber}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.status === 'received_from_surveyor' ? 'bg-sky-50 text-sky-700' :
                          s.status === 'sent_to_capturing' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {s.status === 'received_from_surveyor' ? 'Received from Surveyor' :
                            s.status === 'sent_to_capturing' ? 'In Progress (Capturing)' : 'Forwarded to Surveyor'}
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
                        View Capturing Report
                      </a>
                    )}

                    {s.status === 'received_from_surveyor' && (
                      <button
                        onClick={() => handleSendToCapturing(s._id)}
                        disabled={actionLoading === s._id}
                        className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-violet-700 active:scale-[0.98] transition disabled:opacity-50 mt-3"
                      >
                        <Send size={14} /> Send to Capturing
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">{SECTIONS.find(s => s.key === section)?.label}</h3>
            {fetching ? (
              <TableSkeleton rows={3} />
            ) : visible.length === 0 ? (
              <p className="text-slate-500 text-sm">No files in this section.</p>
            ) : (
              <div className="space-y-3">{visible.map(renderFile)}</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function ControllerWorkflowPage() {
  return (
    <Suspense fallback={null}>
      <ControllerWorkflowContent />
    </Suspense>
  )
}

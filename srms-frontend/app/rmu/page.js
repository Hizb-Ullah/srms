'use client'

import { useState, useEffect, Suspense } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  rmuSearchRecord,
  rmuGetRecords,
  rmuGetPendingCollections,
  rmuAddNewArrival,
  rmuEnterReceipt,
  rmuSubmitToController,
  rmuReturnFromController,
  rmuMarkCollected,
  rmuSendComment,
  rmuSendStandaloneComment,
  rmuGetStandaloneComments,
  rmuSendToStorage
} from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Search, Inbox, Send, PackageCheck, ClipboardList,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Receipt, MessageSquare, X, FileBarChart, Plus
} from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

const RMU_STATUS_LABELS = {
  received_from_surveyor: 'Received from Surveyor',
  submitted_to_controller: 'With Controller',
  returned_from_controller: 'Pending Collection',
  collected: 'Dispatched',
  in_storage: 'In Storage'
}

const RMU_STATUS_COLOR = {
  received_from_surveyor: 'bg-sky-50 text-sky-700',
  submitted_to_controller: 'bg-violet-50 text-violet-700',
  returned_from_controller: 'bg-amber-50 text-amber-700',
  collected: 'bg-emerald-50 text-emerald-700',
  in_storage: 'bg-slate-100 text-slate-700'
}

const CONTROLLER_STAGE_LABELS = {
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

// Every stage transition is timestamped automatically — Check File Status
// pulls this together into one auto-generated timeline, no manual entry.
const buildTimeline = (rec) => {
  const events = []
  if (rec.rmuReceivedAt) events.push({ at: rec.rmuReceivedAt, label: 'Received from Surveyor (New Arrival)' })
  if (rec.receiptEnteredAt) events.push({ at: rec.receiptEnteredAt, label: `Receipt Recorded — ${rec.paymentReceiptNumber}` })
  if (rec.rmuSubmittedToControllerAt) events.push({ at: rec.rmuSubmittedToControllerAt, label: 'Sent to Controller' })
  rec.controllerHistory?.forEach(h => {
    events.push({ at: h.at, label: CONTROLLER_STAGE_LABELS[h.stage] || h.stage })
  })
  if (rec.rmuReturnedAt) events.push({ at: rec.rmuReturnedAt, label: `Returned from Controller — ${rec.rmuOutcome === 'approved' ? 'Approved' : 'Not Approved'}` })
  if (rec.rmuCollectedAt) events.push({ at: rec.rmuCollectedAt, label: 'Collected — Dispatched' })
  if (rec.rmuStorageAt) events.push({ at: rec.rmuStorageAt, label: 'Sent to Storage' })
  return events.sort((a, b) => new Date(a.at) - new Date(b.at))
}

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

function RmuContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'arrivals'

  const [records, setRecords] = useState([])
  const [pendingCollections, setPendingCollections] = useState([])
  const [fetching, setFetching] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // Search
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  // Receipt entry
  const [receiptFor, setReceiptFor] = useState(null)
  const [receiptNumber, setReceiptNumber] = useState('')

  // New Arrival — Officer types the Set # (SR#); since it's already loaded
  // into the system from the Lot Number request, matching records appear as
  // a dropdown to pick from (avoids typos like "02/2026" vs "2/2026"), then
  // Receipt # + OK/Receive.
  const [addOpen, setAddOpen] = useState(false)
  const [addSr, setAddSr] = useState('')
  const [addReceipt, setAddReceipt] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addSrSuggestions, setAddSrSuggestions] = useState([])
  const [addSrOpen, setAddSrOpen] = useState(false)

  // Collected — Officer enters the surveyor's registration number to confirm
  // identity before the Collected/Dispatched action activates
  const [collectFor, setCollectFor] = useState(null)
  const [collectCode, setCollectCode] = useState('')

  // Return outcome
  const [returnFor, setReturnFor] = useState(null)

  // Reports — RMU can query and filter their own records
  const [reportFilters, setReportFilters] = useState({ status: '', village: '', surveyorCode: '', from: '', to: '' })
  const [reportResults, setReportResults] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  // Send Surveyor Comment modal
  const [commentFor, setCommentFor] = useState(null)
  const [commentMsg, setCommentMsg] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const handleSendComment = async () => {
    if (!commentMsg.trim()) return toast.error('Comment message is required')
    setSendingComment(true)
    try {
      await rmuSendComment(commentFor, { message: commentMsg })
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

  // Standalone Send Surveyor Comment tab
  const [standaloneComments, setStandaloneComments] = useState([])
  const [scSurveyor, setScSurveyor] = useState('')
  const [scMessage, setScMessage] = useState('')
  const [scSending, setScSending] = useState(false)

  useEffect(() => { fetchAll() }, [])

  // Check File Status: automatically shows status as the SR# is typed
  useEffect(() => {
    if (tab !== 'status') return
    if (query.trim().length < 2) { setSearchResults(null); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await rmuSearchRecord(query.trim())
        setSearchResults(res.data.data)
      } catch { /* ignore while typing */ } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [query, tab])

  // New Arrival: as the Officer types the Set # (SR#), show matching
  // not-yet-received records to pick from — the record already exists from
  // the Lot Number request, this just avoids typing the exact SR# by hand.
  useEffect(() => {
    if (!addOpen || addSr.trim().length < 2) { setAddSrSuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await rmuSearchRecord(addSr.trim())
        const q = addSr.trim().toLowerCase()
        const matches = []
        res.data.data.forEach(rec => {
          if (rec.rmuStatus) return // already received/in-workflow — not a "new arrival"
          rec.plots?.forEach(p => {
            if (p.surveyRecordNumber.toLowerCase().includes(q)) {
              matches.push({ sr: p.surveyRecordNumber, village: rec.village, name: rec.requestedBy?.name })
            }
          })
        })
        setAddSrSuggestions(matches)
      } catch { /* ignore while typing */ }
    }, 300)
    return () => clearTimeout(t)
  }, [addSr, addOpen])

  const handleSendStandalone = async (e) => {
    e.preventDefault()
    if (!scSurveyor.trim()) return toast.error('Surveyor code or email is required')
    if (!scMessage.trim()) return toast.error('Comment message is required')
    setScSending(true)
    try {
      const res = await rmuSendStandaloneComment({ surveyorIdentifier: scSurveyor, message: scMessage })
      toast.success(res.data.message)
      setScSurveyor('')
      setScMessage('')
      const cRes = await rmuGetStandaloneComments()
      setStandaloneComments(cRes.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send comment')
    } finally {
      setScSending(false)
    }
  }

  const fetchAll = async () => {
    try {
      const [rRes, pRes, cRes] = await Promise.all([rmuGetRecords(), rmuGetPendingCollections(), rmuGetStandaloneComments()])
      setRecords(rRes.data.data)
      setPendingCollections(pRes.data.data)
      setStandaloneComments(cRes.data.data)
    } catch {
      toast.error('Failed to load RMU records')
    } finally {
      setFetching(false)
    }
  }

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return toast.error('Enter an SR#, DSM#, or Lot Number')
    setSearching(true)
    try {
      const res = await rmuSearchRecord(query.trim())
      setSearchResults(res.data.data)
      if (res.data.data.length === 0) toast('No matching record found', { icon: 'ℹ️' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  // Refreshes every view that could be showing a now-stale record — the main
  // lists, and (if currently populated) the Check File Status search results
  // and the Reports query results, since renderRecord's action buttons are
  // reused inside both.
  const refreshViews = async () => {
    await fetchAll()
    if (searchResults) handleSearch()
    if (reportResults) runReport()
  }

  const act = async (fn, id, successMsg, data) => {
    setActionLoading(id)
    try {
      await fn(id, data)
      toast.success(successMsg)
      setReceiptFor(null)
      setReceiptNumber('')
      setReturnFor(null)
      await refreshViews()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  // Add New Arrival — Officer types Set # (SR#) + Receipt #, clicks OK. No
  // search step; the record is looked up and received in one action.
  const handleAddNewArrival = async (e) => {
    e.preventDefault()
    if (!addSr.trim()) return toast.error('Set # (SR#) is required')
    if (!addReceipt.trim()) return toast.error('Receipt number is required')
    setAddLoading(true)
    try {
      await rmuAddNewArrival({ srNumber: addSr.trim(), receiptNumber: addReceipt.trim() })
      toast.success('New arrival added')
      setAddOpen(false)
      setAddSr('')
      setAddReceipt('')
      setAddSrSuggestions([])
      await fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setAddLoading(false)
    }
  }

  // Collected — Officer enters the surveyor's registration number to confirm
  // identity before this activates.
  const handleCollected = async (id) => {
    if (!collectCode.trim()) return toast.error("Surveyor's registration number is required")
    setActionLoading(id)
    try {
      await rmuMarkCollected(id, { surveyorCode: collectCode.trim() })
      toast.success('File marked as collected — Received from RMU on surveyor\'s portal')
      setCollectFor(null)
      setCollectCode('')
      await refreshViews()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const runReport = async (e) => {
    e?.preventDefault()
    setReportLoading(true)
    try {
      const params = {}
      Object.entries(reportFilters).forEach(([k, v]) => { if (v.trim()) params[k] = v.trim() })
      const res = await rmuGetRecords(params)
      setReportResults(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run report')
    } finally {
      setReportLoading(false)
    }
  }

  const stats = {
    received: records.filter(r => r.rmuStatus === 'received_from_surveyor').length,
    withController: records.filter(r => r.rmuStatus === 'submitted_to_controller').length,
    pending: pendingCollections.length,
    collected: records.filter(r => r.rmuStatus === 'collected').length,
    inStorage: records.filter(r => r.rmuStatus === 'in_storage').length,
  }

  const cards = [
    { label: 'Received from Surveyors', value: stats.received,       icon: Inbox,         color: 'bg-sky-50 text-sky-700' },
    { label: 'With Controller',         value: stats.withController, icon: Send,          color: 'bg-violet-50 text-violet-700' },
    { label: 'Pending Collection',      value: stats.pending,        icon: ClipboardList, color: 'bg-amber-50 text-amber-700' },
    { label: 'Dispatched',              value: stats.collected,      icon: PackageCheck,  color: 'bg-emerald-50 text-emerald-700' },
    { label: 'In Storage',              value: stats.inStorage,      icon: ClipboardList, color: 'bg-slate-100 text-slate-700' },
  ]

  const renderRecord = (rec, { fromSearch = false, quickSend = false } = {}) => (
    <div key={rec._id} className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(expanded === rec._id ? null : rec._id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium text-sm text-slate-800">{rec.village}</span>
          <span className="text-xs text-slate-400">{rec.requestedBy?.name || '—'}</span>
          {rec.rmuStatus ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RMU_STATUS_COLOR[rec.rmuStatus]}`}>
              {RMU_STATUS_LABELS[rec.rmuStatus]}
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              Not yet received
            </span>
          )}
          {rec.rmuOutcome && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              rec.rmuOutcome === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {rec.rmuOutcome === 'approved' ? 'Approved' : 'Not Approved'}
            </span>
          )}
          {rec.paymentReceiptNumber && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Paid · Receipt {rec.paymentReceiptNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          {quickSend && rec.rmuStatus === 'received_from_surveyor' && (
            <button
              onClick={(e) => { e.stopPropagation(); act(rmuSubmitToController, rec._id, 'Record submitted to Controller') }}
              disabled={actionLoading === rec._id || (rec.group === 'Private' && !rec.paymentReceiptNumber)}
              title={rec.group === 'Private' && !rec.paymentReceiptNumber ? 'Receipt # required for Private surveyors' : 'Send to Controller'}
              className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-violet-700 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={13} /> Send
            </button>
          )}
          <span className="text-xs">{new Date(rec.createdAt).toLocaleDateString()}</span>
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

          {rec.rmuComments?.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs space-y-1">
              <p className="font-medium text-orange-700">Comments sent to surveyor</p>
              {rec.rmuComments.map((c, i) => (
                <p key={i} className="text-slate-600">
                  {c.message} <span className="text-slate-400">· {new Date(c.sentAt).toLocaleDateString()}</span>
                </p>
              ))}
            </div>
          )}

          {rec.requestedBy?.surveyorCode && (
            <p className="text-xs text-slate-500">Surveyor Code: <span className="font-mono font-medium">{rec.requestedBy.surveyorCode}</span></p>
          )}

          {/* Action buttons per RMU stage */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!rec.rmuStatus && (
              <p className="text-xs text-slate-500 italic">
                Not yet received — use &quot;New Arrival Files&quot; to receive it (SR# + Receipt # together).
              </p>
            )}

            {rec.rmuStatus && !rec.paymentReceiptNumber && (
              receiptFor === rec._id ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Receipt / invoice number"
                    className="border border-emerald-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 w-48"
                  />
                  <button
                    onClick={() => {
                      if (!receiptNumber.trim()) return toast.error('Receipt number is required')
                      act(rmuEnterReceipt, rec._id, 'Receipt recorded — marked as Paid', { receiptNumber })
                    }}
                    disabled={actionLoading === rec._id}
                    className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setReceiptFor(null); setReceiptNumber('') }}
                    className="border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setReceiptFor(rec._id); setReceiptNumber('') }}
                  className="flex items-center gap-1.5 border border-emerald-300 text-emerald-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-50 transition"
                >
                  <Receipt size={14} /> Enter Payment Receipt #
                </button>
              )
            )}

            {rec.rmuStatus === 'received_from_surveyor' && (
              rec.group === 'Private' && !rec.paymentReceiptNumber ? (
                <div className="flex items-center gap-2">
                  <button
                    disabled
                    title="Private surveyor records require a payment receipt number before submission"
                    className="flex items-center gap-1.5 bg-slate-200 text-slate-400 px-3 py-2 rounded-lg text-xs font-medium cursor-not-allowed"
                  >
                    <Send size={14} /> Submit to Controller
                  </button>
                  <span className="text-xs text-rose-600">Receipt # required for Private surveyors</span>
                </div>
              ) : (
                <button
                  onClick={() => act(rmuSubmitToController, rec._id, 'Record submitted to Controller')}
                  disabled={actionLoading === rec._id}
                  className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-violet-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  <Send size={14} /> Submit to Controller
                  {rec.group === 'LandBoard' && !rec.paymentReceiptNumber && (
                    <span className="opacity-75">(payment optional)</span>
                  )}
                </button>
              )
            )}

            {rec.rmuStatus === 'submitted_to_controller' && (
              returnFor === rec._id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => act(rmuReturnFromController, rec._id, 'Record received back — pending collection', { outcome: 'approved' })}
                    disabled={actionLoading === rec._id}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <CheckCircle size={14} /> Approved
                  </button>
                  <button
                    onClick={() => act(rmuReturnFromController, rec._id, 'Record received back — pending collection', { outcome: 'not_approved' })}
                    disabled={actionLoading === rec._id}
                    className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    <XCircle size={14} /> Not Approved
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
                  className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-600 transition"
                >
                  <Inbox size={14} /> ① Received (Back from Controller)
                </button>
              )
            )}

            {rec.rmuStatus === 'collected' && (
              <button
                onClick={() => act(rmuSendToStorage, rec._id, 'File sent to storage')}
                disabled={actionLoading === rec._id}
                className="flex items-center gap-1.5 bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-800 active:scale-[0.98] transition disabled:opacity-50"
              >
                <PackageCheck size={14} /> Send File to Storage
              </button>
            )}

            <button
              onClick={() => { setCommentFor(rec._id); setCommentMsg('') }}
              className="flex items-center gap-1.5 border border-orange-300 text-orange-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-50 transition"
            >
              <MessageSquare size={14} /> Send Surveyor Comment
            </button>

            {rec.rmuStatus === 'returned_from_controller' && (
              collectFor === rec._id ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    value={collectCode}
                    onChange={(e) => setCollectCode(e.target.value)}
                    placeholder="Surveyor's registration number"
                    className="border border-emerald-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 w-56"
                  />
                  <button
                    onClick={() => handleCollected(rec._id)}
                    disabled={actionLoading === rec._id}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <PackageCheck size={14} /> ② Collected
                  </button>
                  <button
                    onClick={() => { setCollectFor(null); setCollectCode('') }}
                    className="border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setCollectFor(rec._id); setCollectCode('') }}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 active:scale-[0.98] transition"
                >
                  <PackageCheck size={14} /> ② Collected
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <DashboardLayout title="RMU — Records Management Unit">
      <div className="space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-xl p-5 flex items-center gap-4 ${color}`}>
              <Icon size={24} />
              <div>
                <p className="text-xs font-medium opacity-75">{label}</p>
                <p className="text-3xl font-bold">{fetching ? '—' : value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs — per client's RMU dashboard schema */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {[
            { key: 'arrivals',   label: 'New Arrival Files',        count: stats.received },
            { key: 'controller', label: 'To Controller',            count: stats.withController },
            { key: 'returned',   label: 'Returned from Controller', count: stats.pending },
            { key: 'status',     label: 'Track File',               count: null },
            { key: 'comments',   label: 'Send Surveyor (Summary)',  count: null },
            { key: 'storage',    label: 'Storage',                  count: stats.inStorage },
            { key: 'reports',    label: 'Reports',                  count: null },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => router.push(`/rmu?tab=${t.key}`)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* New Arrival Files — Officer ADDS the file (no search): Set # + Receipt #, then OK */}
        {tab === 'arrivals' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              {!addOpen ? (
                <button
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition"
                >
                  <Plus size={16} /> Add New Arrival
                </button>
              ) : (
                <form onSubmit={handleAddNewArrival} className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Add New Arrival</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-slate-600 mb-1">Set # (SR#)</label>
                      <input
                        autoFocus
                        value={addSr}
                        onChange={(e) => { setAddSr(e.target.value); setAddSrOpen(true) }}
                        onFocus={() => setAddSrOpen(true)}
                        onBlur={() => setTimeout(() => setAddSrOpen(false), 150)}
                        placeholder="e.g. 10/2026"
                        className={inp}
                        autoComplete="off"
                      />
                      {addSrOpen && addSrSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {addSrSuggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onMouseDown={() => { setAddSr(s.sr); setAddSrOpen(false); setAddSrSuggestions([]) }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                            >
                              <span className="font-mono font-medium text-indigo-700">{s.sr}</span>
                              <span className="text-slate-400"> — {s.village} · {s.name || '—'}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Receipt #</label>
                      <input
                        value={addReceipt}
                        onChange={(e) => setAddReceipt(e.target.value)}
                        placeholder="Enter Receipt Number"
                        className={inp}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <CheckCircle size={16} /> {addLoading ? 'Submitting...' : 'OK / Receive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddOpen(false); setAddSr(''); setAddReceipt(''); setAddSrSuggestions([]) }}
                      className="border border-slate-200 text-slate-500 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">New Arrival Files (Received from Surveyors)</h3>
              {fetching ? <TableSkeleton rows={3} /> :
                records.filter(r => r.rmuStatus === 'received_from_surveyor').length === 0
                  ? <p className="text-slate-500 text-sm">No new arrival files. Click &quot;Add New Arrival&quot; above to receive one.</p>
                  : <div className="space-y-3">{records.filter(r => r.rmuStatus === 'received_from_surveyor').map(rec => renderRecord(rec))}</div>}
            </div>
          </>
        )}

        {/* To Controller — files ready to send, each with a quick Send button */}
        {tab === 'controller' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">To Controller</h3>
            {fetching ? <TableSkeleton rows={2} /> :
              records.filter(r => r.rmuStatus === 'received_from_surveyor').length === 0
                ? <p className="text-slate-500 text-sm">No files ready to send.</p>
                : <div className="space-y-3">{records.filter(r => r.rmuStatus === 'received_from_surveyor').map(rec => renderRecord(rec, { quickSend: true }))}</div>}
          </div>
        )}

        {/* Returned from Controller — pending collection + collected */}
        {tab === 'returned' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Pending Collection Files</h3>
              {fetching ? <TableSkeleton rows={3} /> :
                pendingCollections.length === 0
                  ? <p className="text-slate-500 text-sm">No files pending collection.</p>
                  : <div className="space-y-3">{pendingCollections.map(rec => renderRecord(rec))}</div>}
            </div>

            {records.filter(r => r.rmuStatus === 'collected').length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Dispatched Files</h3>
                <div className="space-y-3">{records.filter(r => r.rmuStatus === 'collected').map(rec => renderRecord(rec))}</div>
              </div>
            )}
          </>
        )}

        {/* Track File — search any record and view its full status + timeline */}
        {tab === 'status' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-800">Track File (SR# · DSM# · Lot Number)</h3>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 2/2026 or Lot 234 Tsabong"
                className={inp}
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 shrink-0"
              >
                {searching ? 'Tracking...' : 'Track'}
              </button>
            </form>
            {searchResults && (
              <div className="mt-4 space-y-3">
                {searchResults.length === 0
                  ? <p className="text-slate-500 text-sm">No record found for that number.</p>
                  : searchResults.map(rec => (
                      <div key={rec._id} className="space-y-2">
                        {renderRecord(rec, { fromSearch: true })}
                        {buildTimeline(rec).length > 0 && (
                          <div className="border border-slate-100 rounded-xl p-4 ml-2">
                            <p className="text-xs font-medium text-slate-600 mb-2">Timeline</p>
                            <ol className="space-y-1.5">
                              {buildTimeline(rec).map((ev, i) => (
                                <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                  <span className="font-medium text-slate-700">{ev.label}</span>
                                  <span className="text-slate-400">— {new Date(ev.at).toLocaleString()}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
              </div>
            )}
          </div>
        )}

        {/* Storage — files sent to storage after dispatch */}
        {tab === 'storage' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Files in Storage</h3>
            {fetching ? <TableSkeleton rows={3} /> :
              records.filter(r => r.rmuStatus === 'in_storage').length === 0
                ? <p className="text-slate-500 text-sm">No files in storage yet. Dispatched files can be sent to storage from the Returned from Controller tab.</p>
                : <div className="space-y-3">{records.filter(r => r.rmuStatus === 'in_storage').map(rec => renderRecord(rec))}</div>}
          </div>
        )}

        {/* Reports — RMU can query and filter their own records */}
        {tab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <FileBarChart size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-800">Reports</h3>
            </div>
            <form onSubmit={runReport} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <select
                value={reportFilters.status}
                onChange={(e) => setReportFilters(f => ({ ...f, status: e.target.value }))}
                className={inp}
              >
                <option value="">Any status</option>
                {Object.entries(RMU_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input
                value={reportFilters.village}
                onChange={(e) => setReportFilters(f => ({ ...f, village: e.target.value }))}
                placeholder="Village"
                className={inp}
              />
              <input
                value={reportFilters.surveyorCode}
                onChange={(e) => setReportFilters(f => ({ ...f, surveyorCode: e.target.value }))}
                placeholder="Surveyor Code"
                className={inp}
              />
              <input
                type="date"
                value={reportFilters.from}
                onChange={(e) => setReportFilters(f => ({ ...f, from: e.target.value }))}
                className={inp}
                title="From date"
              />
              <input
                type="date"
                value={reportFilters.to}
                onChange={(e) => setReportFilters(f => ({ ...f, to: e.target.value }))}
                className={inp}
                title="To date"
              />
              <button
                type="submit"
                disabled={reportLoading}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 sm:col-span-3 lg:col-span-1"
              >
                {reportLoading ? 'Running...' : 'Run Report'}
              </button>
            </form>

            {reportResults && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">{reportResults.length} record(s) found</p>
                {reportResults.length === 0
                  ? <p className="text-slate-500 text-sm">No records match those filters.</p>
                  : reportResults.map(rec => renderRecord(rec, { fromSearch: true }))}
              </div>
            )}
          </div>
        )}

        {/* Send Surveyor Comment — standalone (e.g. file could not be loaded on New Arrivals) */}
        {tab === 'comments' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-orange-500" />
              <h3 className="font-semibold text-slate-800">Send Surveyor (Summary)</h3>
            </div>
            <p className="text-xs text-slate-500">
              If a file isn&apos;t OK, send the surveyor a summary note directly — for example when their file could not be loaded on New Arrivals.
            </p>
            <form onSubmit={handleSendStandalone} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Surveyor Code or Email</label>
                <input
                  value={scSurveyor}
                  onChange={(e) => setScSurveyor(e.target.value)}
                  placeholder="e.g. 01/2026 or surveyor@email.com"
                  className={inp}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Comment</label>
                <textarea
                  value={scMessage}
                  onChange={(e) => setScMessage(e.target.value)}
                  rows={3}
                  placeholder="Write your comment..."
                  className={`${inp} resize-none`}
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={scSending}
                  className="bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {scSending ? 'Sending...' : 'Send Comment'}
                </button>
              </div>
            </form>

            {standaloneComments.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 text-sm mb-3">Sent Comments</h4>
                <div className="space-y-2">
                  {standaloneComments.map(c => (
                    <div key={c._id} className="border border-slate-100 rounded-lg px-4 py-2.5 text-xs">
                      <p className="font-medium text-slate-800">
                        To: {c.surveyor?.name} {c.surveyor?.surveyorCode && <span className="font-mono text-slate-500">({c.surveyor.surveyorCode})</span>}
                      </p>
                      <p className="text-slate-600 mt-0.5">{c.message}</p>
                      <p className="text-slate-400 mt-0.5">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Send Surveyor Comment modal */}
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
    </DashboardLayout>
  )
}

export default function RmuPage() {
  return (
    <Suspense fallback={null}>
      <RmuContent />
    </Suspense>
  )
}

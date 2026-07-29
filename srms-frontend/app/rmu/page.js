'use client'

import { useState, useEffect, Suspense } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  rmuSearchRecord,
  rmuGetRecords,
  rmuGetPendingCollections,
  rmuReceiveRecord,
  rmuEnterReceipt,
  rmuSubmitToController,
  rmuReturnFromController,
  rmuMarkCollected
} from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Search, Inbox, Send, PackageCheck, ClipboardList,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Receipt
} from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

const RMU_STATUS_LABELS = {
  received_from_surveyor: 'Received from Surveyor',
  submitted_to_controller: 'With Controller',
  returned_from_controller: 'Pending Collection',
  collected: 'Collected'
}

const RMU_STATUS_COLOR = {
  received_from_surveyor: 'bg-sky-50 text-sky-700',
  submitted_to_controller: 'bg-violet-50 text-violet-700',
  returned_from_controller: 'bg-amber-50 text-amber-700',
  collected: 'bg-emerald-50 text-emerald-700'
}

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

function RmuContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'records'

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

  // Return outcome
  const [returnFor, setReturnFor] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [rRes, pRes] = await Promise.all([rmuGetRecords(), rmuGetPendingCollections()])
      setRecords(rRes.data.data)
      setPendingCollections(pRes.data.data)
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

  const act = async (fn, id, successMsg, data) => {
    setActionLoading(id)
    try {
      await fn(id, data)
      toast.success(successMsg)
      setReceiptFor(null)
      setReceiptNumber('')
      setReturnFor(null)
      await fetchAll()
      if (searchResults) handleSearch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const stats = {
    received: records.filter(r => r.rmuStatus === 'received_from_surveyor').length,
    withController: records.filter(r => r.rmuStatus === 'submitted_to_controller').length,
    pending: pendingCollections.length,
    collected: records.filter(r => r.rmuStatus === 'collected').length,
  }

  const cards = [
    { label: 'Received from Surveyors', value: stats.received,       icon: Inbox,         color: 'bg-sky-50 text-sky-700' },
    { label: 'With Controller',         value: stats.withController, icon: Send,          color: 'bg-violet-50 text-violet-700' },
    { label: 'Pending Collection',      value: stats.pending,        icon: ClipboardList, color: 'bg-amber-50 text-amber-700' },
    { label: 'Collected',               value: stats.collected,      icon: PackageCheck,  color: 'bg-emerald-50 text-emerald-700' },
  ]

  const renderRecord = (rec, { fromSearch = false } = {}) => (
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

          {rec.requestedBy?.surveyorCode && (
            <p className="text-xs text-slate-500">Surveyor Code: <span className="font-mono font-medium">{rec.requestedBy.surveyorCode}</span></p>
          )}

          {/* Action buttons per RMU stage */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!rec.rmuStatus && (
              <button
                onClick={() => act(rmuReceiveRecord, rec._id, 'Record marked as received', {})}
                disabled={actionLoading === rec._id}
                className="flex items-center gap-1.5 bg-sky-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-sky-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                <Inbox size={14} /> Record as Received
              </button>
            )}

            {!rec.paymentReceiptNumber && (
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
                  <Inbox size={14} /> Receive Back from Controller
                </button>
              )
            )}

            {rec.rmuStatus === 'returned_from_controller' && (
              <button
                onClick={() => act(rmuMarkCollected, rec._id, 'File marked as collected')}
                disabled={actionLoading === rec._id}
                className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                <PackageCheck size={14} /> Mark as Collected
              </button>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Search — pick up records already added via Lot Allocator */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Find Record (SR# · DSM# · Lot Number)</h3>
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
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults && (
            <div className="mt-4 space-y-3">
              {searchResults.length === 0
                ? <p className="text-slate-500 text-sm">No record found. Records must first be created through the Lot Allocator.</p>
                : searchResults.map(rec => renderRecord(rec, { fromSearch: true }))}
            </div>
          )}
        </div>

        {/* Tabs: All RMU records / Pending Collections */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => router.push('/rmu?tab=records')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === 'records' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            RMU Records
          </button>
          <button
            onClick={() => router.push('/rmu?tab=pending')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              tab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Pending Collections
            {pendingCollections.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pendingCollections.length}
              </span>
            )}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          {tab === 'pending' ? (
            <>
              <h3 className="font-semibold text-slate-800 mb-4">Pending Collection Files</h3>
              {fetching ? <TableSkeleton rows={3} /> :
                pendingCollections.length === 0
                  ? <p className="text-slate-500 text-sm">No files pending collection.</p>
                  : <div className="space-y-3">{pendingCollections.map(rec => renderRecord(rec))}</div>}
            </>
          ) : (
            <>
              <h3 className="font-semibold text-slate-800 mb-4">All RMU Records</h3>
              {fetching ? <TableSkeleton rows={3} /> :
                records.length === 0
                  ? <p className="text-slate-500 text-sm">No RMU records yet. Use the search above to find and receive a record.</p>
                  : <div className="space-y-3">{records.map(rec => renderRecord(rec))}</div>}
            </>
          )}
        </div>
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

'use client'

import { useState, useEffect, Suspense } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { getMyLotRequests } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { MapPin, Clock, RotateCcw, CheckCircle, BarChart3 } from 'lucide-react'

const STATUS_LABELS = {
  pending_allocator_review: 'Pending Review',
  awaiting_payment: 'Awaiting Payment',
  pop_uploaded: 'POP Uploaded',
  payment_confirmed: 'Payment Confirmed',
  approved: 'Approved',
  rejected: 'Rejected'
}

// RMU / Controller stage labels — this is the file's real physical progress,
// separate from the digital lot-allocation request's own status.
const RMU_STATUS_LABELS = {
  received_from_surveyor: 'Received by RMU',
  submitted_to_controller: 'With Controller',
  returned_from_controller: 'Returned — Pending Collection',
  collected: 'Collected',
  in_storage: 'In Storage'
}

const CONTROLLER_STAGE_LABELS = {
  received_unassigned: 'With Controller — Not Yet Assigned',
  sent_to_registration: 'Sent to Registration & Reservation',
  received_from_registration: 'In Registration & Reservation',
  sent_to_capturing: 'Sent to Capturing',
  received_from_capturing: 'In Capturing',
  sent_to_examination: 'Sent to Examination',
  received_from_examination: 'In Examination',
  sent_to_approval: 'Sent to Approval',
  received_from_approval: 'In Approval'
}

// Per client: once RMU registers a file, and every time the Controller moves
// it onward, the surveyor should see that live progress — not the digital
// lot-allocation request's own status.
const getFileProgress = (r) => {
  if (!r.rmuStatus) return null
  if (r.rmuStatus === 'submitted_to_controller' && r.controllerStage && CONTROLLER_STAGE_LABELS[r.controllerStage]) {
    return CONTROLLER_STAGE_LABELS[r.controllerStage]
  }
  return RMU_STATUS_LABELS[r.rmuStatus] || r.rmuStatus
}

function DashboardContent() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'overview'

  useEffect(() => {
    getMyLotRequests()
      .then(res => setRequests(res.data.data))
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const rts       = requests.filter(r => r.status === 'rejected')
  const approved  = requests.filter(r => r.status === 'approved')
  // Submitted Files: the physical file has been submitted at DSM and
  // recorded by RMU (rmuStatus is set) — not just a digital request made.
  const submitted = requests.filter(r => !!r.rmuStatus)
  // Progress of Submitted Files: those same submitted files, while still
  // actively moving through RMU/Controller (not yet collected or archived).
  const inProgress = requests.filter(r => r.rmuStatus && !['collected', 'in_storage'].includes(r.rmuStatus))

  // Monthly statistics — Submitted / RTS / Approved totals grouped by the
  // month the request was originally made, most recent month first.
  const monthlyStats = Object.values(
    requests.reduce((acc, r) => {
      const d = new Date(r.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!acc[key]) {
        acc[key] = {
          key,
          label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
          submitted: 0,
          rts: 0,
          approved: 0
        }
      }
      if (r.rmuStatus) acc[key].submitted += 1
      if (r.status === 'rejected') acc[key].rts += 1
      if (r.status === 'approved') acc[key].approved += 1
      return acc
    }, {})
  ).sort((a, b) => b.key.localeCompare(a.key))

  const cards = [
    { label: 'Submitted Files',             value: submitted.length,  icon: MapPin,      color: 'bg-indigo-50 text-indigo-700',  tab: 'submitted' },
    { label: 'Progress of Submitted Files', value: inProgress.length, icon: Clock,       color: 'bg-amber-50 text-amber-700',    tab: 'progress' },
    { label: 'Files on RTS',                value: rts.length,        icon: RotateCcw,   color: 'bg-rose-50 text-rose-700',      tab: 'rts' },
    { label: 'Approved Files',              value: approved.length,   icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700', tab: 'approved' },
  ]

  const tabData = {
    submitted: { list: submitted,  title: 'Submitted Files',        useFileProgress: true },
    progress:  { list: inProgress, title: 'Progress of Submitted Files', useFileProgress: true },
    rts:       { list: rts,        title: 'Files On RTS (Returned)', useFileProgress: false },
    approved:  { list: approved,   title: 'Approved Files',          useFileProgress: false },
  }

  const RequestTable = ({ list, emptyMsg, useFileProgress = false }) => (
    list.length === 0
      ? <p className="text-slate-500 text-sm">{emptyMsg}</p>
      : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="pb-3">Village</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => {
              const fileProgress = useFileProgress ? getFileProgress(r) : null
              return (
                <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium">{r.village}</td>
                  <td className="py-3 text-slate-500 capitalize">{r.requestType?.replace(/_/g, ' ')}</td>
                  <td className="py-3">
                    {fileProgress ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                        {fileProgress}
                      </span>
                    ) : (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        r.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{STATUS_LABELS[r.status] || r.status?.replace(/_/g, ' ')}</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
  )

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stat cards — clickable */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon, color, tab: t }) => (
            <button
              key={t}
              onClick={() => router.push(`/surveyor/dashboard?tab=${t}`)}
              className={`rounded-xl p-5 flex items-center gap-4 ${color} border-2 text-left transition hover:scale-[1.02] active:scale-[0.98] ${
                tab === t ? 'border-current shadow-md' : 'border-transparent border-opacity-20'
              }`}
            >
              <Icon size={24} />
              <div>
                <p className="text-xs font-medium opacity-75">{label}</p>
                <p className="text-3xl font-bold">{loading ? '—' : value}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Statistics button — monthly Submitted / RTS / Approved totals */}
        <button
          onClick={() => router.push('/surveyor/dashboard?tab=stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition active:scale-[0.98] ${
            tab === 'stats'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 size={16} /> Statistics
        </button>

        {/* Tab content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          {tab === 'overview' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Recent Lot Requests</h3>
                <button onClick={() => router.push('/surveyor/lot-requests')}
                  className="text-xs text-indigo-600 hover:underline">View all</button>
              </div>
              {loading
                ? <p className="text-slate-400 text-sm">Loading...</p>
                : <RequestTable list={requests.slice(0, 5)} emptyMsg="No lot requests yet." />
              }
            </>
          ) : tab === 'stats' ? (
            <>
              <h3 className="font-semibold text-slate-800 mb-4">Monthly Statistics</h3>
              {loading ? (
                <p className="text-slate-400 text-sm">Loading...</p>
              ) : monthlyStats.length === 0 ? (
                <p className="text-slate-500 text-sm">No data yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="pb-3">Month</th>
                      <th className="pb-3">Submitted Files</th>
                      <th className="pb-3">Files on RTS</th>
                      <th className="pb-3">Approved Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.map(m => (
                      <tr key={m.key} className="border-b border-slate-50 hover:bg-slate-50 transition">
                        <td className="py-3 font-medium">{m.label}</td>
                        <td className="py-3 text-indigo-700 font-semibold">{m.submitted}</td>
                        <td className="py-3 text-rose-700 font-semibold">{m.rts}</td>
                        <td className="py-3 text-emerald-700 font-semibold">{m.approved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <>
              <h3 className="font-semibold text-slate-800 mb-4">{tabData[tab]?.title}</h3>
              {loading
                ? <p className="text-slate-400 text-sm">Loading...</p>
                : <RequestTable list={tabData[tab]?.list || []} emptyMsg="No records found." useFileProgress={tabData[tab]?.useFileProgress} />
              }
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PrivateSurveyorDashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { getMyLotRequests } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { MapPin, Clock, RotateCcw, CheckCircle } from 'lucide-react'

const STATUS_LABELS = {
  pending_allocator_review: 'Pending Review',
  awaiting_payment: 'Awaiting Payment',
  pop_uploaded: 'POP Uploaded',
  payment_confirmed: 'Payment Confirmed',
  approved: 'Approved',
  rejected: 'Rejected'
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

  // Per client: "Submitted Files" and "Progress of Submitted Files" track two
  // distinct milestones, not just the digital request's own status —
  //   Progress of Submitted Files = plot number request approved by the Lot
  //     Allocator (status moved past pending_allocator_review), but the
  //     physical file hasn't reached RMU yet.
  //   Submitted Files = the physical file has actually been submitted at DSM
  //     and recorded/updated by RMU (rmuStatus is set).
  // Once a request reaches a final outcome it belongs only to RTS/Approved,
  // not double-counted in either of the above.
  const rts        = requests.filter(r => r.status === 'rejected')
  const approved   = requests.filter(r => r.status === 'approved')
  const submitted  = requests.filter(r => r.rmuStatus && !['approved', 'rejected'].includes(r.status))
  const inProgress = requests.filter(r =>
    !r.rmuStatus &&
    !['pending_allocator_review', 'approved', 'rejected'].includes(r.status)
  )

  const cards = [
    { label: 'Submitted Files',             value: submitted.length,  icon: MapPin,      color: 'bg-indigo-50 text-indigo-700',  tab: 'submitted' },
    { label: 'Progress of Submitted Files', value: inProgress.length, icon: Clock,       color: 'bg-amber-50 text-amber-700',    tab: 'progress' },
    { label: 'Files on RTS',                value: rts.length,        icon: RotateCcw,   color: 'bg-rose-50 text-rose-700',      tab: 'rts' },
    { label: 'Approved Files',              value: approved.length,   icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700', tab: 'approved' },
  ]

  const tabData = {
    submitted: { list: submitted,  title: 'Submitted Files' },
    progress:  { list: inProgress, title: 'Files In Progress' },
    rts:       { list: rts,        title: 'Files On RTS (Returned)' },
    approved:  { list: approved,   title: 'Approved Files' },
  }

  const RequestTable = ({ list, emptyMsg }) => (
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
            {list.map(r => (
              <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="py-3 font-medium">{r.village}</td>
                <td className="py-3 text-slate-500 capitalize">{r.requestType?.replace(/_/g, ' ')}</td>
                <td className="py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    r.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>{STATUS_LABELS[r.status] || r.status?.replace(/_/g, ' ')}</span>
                </td>
                <td className="py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
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
          ) : (
            <>
              <h3 className="font-semibold text-slate-800 mb-4">{tabData[tab]?.title}</h3>
              {loading
                ? <p className="text-slate-400 text-sm">Loading...</p>
                : <RequestTable list={tabData[tab]?.list || []} emptyMsg="No records found." />
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

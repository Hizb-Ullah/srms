'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { getMyLotRequests } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { MapPin, Clock, RotateCcw, CheckCircle } from 'lucide-react'

export default function PrivateSurveyorDashboard() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const router = useRouter()

  useEffect(() => {
    getMyLotRequests()
      .then(res => setRequests(res.data.data))
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const submitted   = requests.length
  const inProgress  = requests.filter(r => !['approved','rejected'].includes(r.status)).length
  const rts         = requests.filter(r => r.status === 'rejected').length
  const approved    = requests.filter(r => r.status === 'approved').length

  const cards = [
    { label: 'Submitted Files',             value: submitted,  icon: MapPin,       color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Progress of Submitted Files', value: inProgress, icon: Clock,        color: 'bg-amber-50 text-amber-700' },
    { label: 'Files on RTS',                value: rts,        icon: RotateCcw,    color: 'bg-rose-50 text-rose-700' },
    { label: 'Approved Files',              value: approved,   icon: CheckCircle,  color: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-xl p-5 flex items-center gap-4 ${color} border border-current border-opacity-20`}>
              <Icon size={24} />
              <div>
                <p className="text-xs font-medium opacity-75">{label}</p>
                <p className="text-3xl font-bold">{loading ? '—' : value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Recent Lot Requests</h3>
            <button onClick={() => router.push('/surveyor/lot-requests')}
              className="text-xs text-indigo-600 hover:underline">View all</button>
          </div>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-slate-500 text-sm">No lot requests yet.</p>
          ) : (
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
                {requests.slice(0, 5).map(r => (
                  <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-3 font-medium">{r.village}</td>
                    <td className="py-3 text-slate-500 capitalize">{r.requestType?.replace(/_/g, ' ')}</td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        r.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{r.status?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

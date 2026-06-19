'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getQueue } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ClipboardList, Camera, Search, Package } from 'lucide-react'

export default function OfficerDashboard() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getQueue()
        setQueue(res.data.data)
      } catch (error) {
        toast.error('Failed to load queue')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const capturing   = queue.filter(f => f.status === 'capturing').length
  const examination = queue.filter(f => f.status === 'examination').length
  const dispatch     = queue.filter(f => f.status === 'dispatch').length

  return (
    <DashboardLayout title="Officer Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total in queue" value={queue.length} icon={<ClipboardList size={20} className="text-indigo-700" />} color="bg-indigo-50" />
        <StatCard title="Capturing"      value={capturing}    icon={<Camera size={20} className="text-amber-700" />}        color="bg-amber-50" />
        <StatCard title="Examination"    value={examination}  icon={<Search size={20} className="text-violet-700" />}        color="bg-violet-50" />
        <StatCard title="Dispatch"       value={dispatch}     icon={<Package size={20} className="text-emerald-700" />}       color="bg-emerald-50" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Files in queue</h3>
          <button
            onClick={() => router.push('/officer/queue')}
            className="text-indigo-600 text-sm font-medium hover:underline"
          >
            View all
          </button>
        </div>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : queue.length === 0 ? (
          <p className="text-slate-500">No files in queue.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Plot number</th>
                <th className="pb-3">Surveyor</th>
                <th className="pb-3">Stage</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 5).map((file) => (
                <tr key={file._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium font-mono text-xs">{file.plotNumber}</td>
                  <td className="py-3">{file.surveyorId?.name}</td>
                  <td className="py-3"><Badge status={file.status} /></td>
                  <td className="py-3 text-slate-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/officer/queue/${file._id}`)}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-95 transition"
                    >
                      Process
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
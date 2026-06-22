'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getQueue } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Clock, CheckCircle } from 'lucide-react'

export default function ApproverDashboard() {
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

  return (
    <DashboardLayout title="Approver Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard title="Pending approval" value={queue.length} icon={<Clock size={20} className="text-amber-700" />}       color="bg-amber-50" />
        <StatCard title="Total reviewed"   value={0}            icon={<CheckCircle size={20} className="text-emerald-700" />} color="bg-emerald-50" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Files pending approval</h3>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : queue.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-amber-50 rounded-xl p-6 max-w-sm mx-auto">
              <p className="text-amber-700 font-medium mb-1">No pending approvals</p>
              <p className="text-amber-600 text-sm">
                Files will appear here once they have passed the examination stage and are ready for your approval.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Plot number</th>
                <th className="pb-3">Surveyor</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((file) => (
                <tr key={file._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium font-mono text-xs">{file.plotNumber}</td>
                  <td className="py-3">{file.surveyorId?.name}</td>
                  <td className="py-3"><Badge status={file.status} /></td>
                  <td className="py-3 text-slate-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/approver/review/${file._id}`)}
                      className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-600 active:scale-95 transition"
                    >
                      Review
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
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
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
        <StatCard title="Pending Approval" value={queue.length} icon={<Clock size={20} />}       color="bg-orange-100 text-orange-900" />
        <StatCard title="Total Reviewed"   value={0}            icon={<CheckCircle size={20} />} color="bg-green-100 text-green-900" />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Files Pending Approval</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : queue.length === 0 ? (
          <p className="text-gray-500">No files pending approval.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Plot Number</th>
                <th className="pb-3">Surveyor</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((file) => (
                <tr key={file._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{file.plotNumber}</td>
                  <td className="py-3">{file.surveyorId?.name}</td>
                  <td className="py-3"><Badge status={file.status} /></td>
                  <td className="py-3 text-gray-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/approver/review/${file._id}`)}
                      className="bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600"
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
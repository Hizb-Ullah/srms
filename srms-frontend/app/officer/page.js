'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
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
        <StatCard title="Total in Queue" value={queue.length} icon={<ClipboardList size={20} />} color="bg-blue-100 text-blue-900" />
        <StatCard title="Capturing"      value={capturing}    icon={<Camera size={20} />}        color="bg-yellow-100 text-yellow-900" />
        <StatCard title="Examination"    value={examination}  icon={<Search size={20} />}        color="bg-purple-100 text-purple-900" />
        <StatCard title="Dispatch"       value={dispatch}     icon={<Package size={20} />}       color="bg-green-100 text-green-900" />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Files in Queue</h3>
          <button
            onClick={() => router.push('/officer/queue')}
            className="text-blue-900 text-sm font-medium hover:underline"
          >
            View All
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : queue.length === 0 ? (
          <p className="text-gray-500">No files in queue.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Plot Number</th>
                <th className="pb-3">Surveyor</th>
                <th className="pb-3">Stage</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 5).map((file) => (
                <tr key={file._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{file.plotNumber}</td>
                  <td className="py-3">{file.surveyorId?.name}</td>
                  <td className="py-3"><Badge status={file.status} /></td>
                  <td className="py-3 text-gray-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/officer/queue/${file._id}`)}
                      className="bg-blue-900 text-white px-3 py-1 rounded text-xs hover:bg-blue-800"
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
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import { getQueue } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ClipboardList } from 'lucide-react'

export default function OfficerQueuePage() {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await getQueue()
        setQueue(res.data.data)
      } catch (error) {
        toast.error('Failed to load queue')
      } finally {
        setLoading(false)
      }
    }
    fetchQueue()
  }, [])

  const filtered = filter === 'all'
    ? queue
    : queue.filter(f => f.status === filter)

  return (
    <DashboardLayout title="File Queue">
      <div className="bg-white rounded-xl shadow p-6">

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'submitted', 'capturing', 'examination', 'dispatch'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition
                ${filter === s
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === 'all' ? ` (${queue.length})` : ` (${queue.filter(f => f.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No files in this category.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Plot Number</th>
                <th className="pb-3">Survey Record</th>
                <th className="pb-3">Surveyor</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => (
                <tr key={file._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{file.plotNumber}</td>
                  <td className="py-3">{file.surveyRecordNumber}</td>
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
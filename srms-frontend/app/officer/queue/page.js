'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'submitted', 'capturing', 'examination', 'dispatch'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition active:scale-95
                ${filter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === 'all' ? ` (${queue.length})` : ` (${queue.filter(f => f.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No files in this category.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Plot number</th>
                <th className="pb-3">Survey record</th>
                <th className="pb-3">Surveyor</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => (
                <tr key={file._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium font-mono text-xs">{file.plotNumber}</td>
                  <td className="py-3 font-mono text-xs">{file.surveyRecordNumber}</td>
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
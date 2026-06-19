'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getAllFiles } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminFilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await getAllFiles()
        setFiles(res.data.data)
      } catch (error) {
        toast.error('Failed to load files')
      } finally {
        setLoading(false)
      }
    }
    fetchFiles()
  }, [])

  const filtered = filter === 'all'
    ? files
    : files.filter((f) => f.status === filter)

  return (
    <DashboardLayout title="All Files">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'submitted', 'capturing', 'examination', 'approval', 'dispatch', 'archived', 'rework'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={filter === s
                ? 'px-4 py-2 rounded-full text-sm font-medium bg-indigo-600 text-white active:scale-95 transition'
                : 'px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition'
              }
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <p className="text-slate-500">No files found.</p>
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
                      className="text-indigo-600 text-xs font-medium hover:underline"
                    >
                      View
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
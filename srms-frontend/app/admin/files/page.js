'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
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
      <div className="bg-white rounded-xl shadow p-6">

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'submitted', 'capturing', 'examination', 'approval', 'dispatch', 'archived', 'rework'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={filter === s
                ? 'px-4 py-2 rounded-full text-sm font-medium bg-blue-900 text-white'
                : 'px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600'
              }
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No files found.</p>
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
                      className="text-blue-900 text-xs font-medium hover:underline"
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
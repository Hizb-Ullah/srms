'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getMyFiles } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FolderOpen } from 'lucide-react'

export default function MyFilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await getMyFiles()
        setFiles(res.data.data)
      } catch (error) {
        toast.error('Failed to load files')
      } finally {
        setLoading(false)
      }
    }
    fetchFiles()
  }, [])

  return (
    <DashboardLayout title="My Files">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">All submitted files</h3>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No files submitted yet.</p>
            <button
              onClick={() => router.push('/surveyor/submit')}
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 active:scale-95 transition"
            >
              Submit first file
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Plot number</th>
                <th className="pb-3">Survey record</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Current stage</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium font-mono text-xs">{file.plotNumber}</td>
                  <td className="py-3 font-mono text-xs">{file.surveyRecordNumber}</td>
                  <td className="py-3"><Badge status={file.status} /></td>
                  <td className="py-3"><Badge status={file.currentStage} /></td>
                  <td className="py-3 text-slate-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/surveyor/files/${file._id}`)}
                      className="text-indigo-600 text-xs font-medium hover:underline"
                    >
                      View details
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
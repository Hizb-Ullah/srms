'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
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
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">All Submitted Files</h3>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No files submitted yet.</p>
            <button
              onClick={() => router.push('/surveyor/submit')}
              className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-800"
            >
              Submit First File
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Plot Number</th>
                <th className="pb-3">Survey Record</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Current Stage</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{file.plotNumber}</td>
                  <td className="py-3">{file.surveyRecordNumber}</td>
                  <td className="py-3"><Badge status={file.status} /></td>
                  <td className="py-3"><Badge status={file.currentStage} /></td>
                  <td className="py-3 text-gray-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => router.push(`/surveyor/files/${file._id}`)}
                      className="text-blue-900 text-xs font-medium hover:underline"
                    >
                      View Details
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
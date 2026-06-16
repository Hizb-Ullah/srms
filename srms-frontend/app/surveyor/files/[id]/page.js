'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import { getFile, getFileAudit, resubmitFile } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

export default function FileDetailPage() {
  const [file, setFile] = useState(null)
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [remarks, setRemarks] = useState('')
  const [resubmitting, setResubmitting] = useState(false)
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const fileRes = await getFile(id)
        const auditRes = await getFileAudit(id)
        setFile(fileRes.data.data)
        setAudit(auditRes.data.data)
      } catch (error) {
        toast.error('Failed to load file')
      } finally {
        setLoading(false)
      }
    }
    fetchFile()
  }, [id])

  const handleResubmit = async () => {
    setResubmitting(true)
    try {
      await resubmitFile(id, { remarks })
      toast.success('File resubmitted successfully')
      router.push('/surveyor/files')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resubmit file')
    } finally {
      setResubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="File Details">
        <p className="text-gray-500">Loading...</p>
      </DashboardLayout>
    )
  }

  if (!file) {
    return (
      <DashboardLayout title="File Details">
        <p className="text-red-500">File not found.</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="File Details">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">File Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Plot Number</p>
                <p className="font-bold text-blue-900">{file.plotNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Survey Record</p>
                <p className="font-bold text-blue-900">{file.surveyRecordNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge status={file.status} />
              </div>
              <div>
                <p className="text-gray-500">Current Stage</p>
                <Badge status={file.currentStage} />
              </div>
              <div>
                <p className="text-gray-500">Submitted</p>
                <p>{new Date(file.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Workflow Progress</h3>
            <div className="space-y-3">
              {file.stages.map((stage, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{stage.name}</p>
                    {stage.remarks && (
                      <p className="text-xs text-red-500 mt-1">{stage.remarks}</p>
                    )}
                  </div>
                  <Badge status={stage.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Audit Trail</h3>
            {audit.length === 0 ? (
              <p className="text-gray-500 text-sm">No actions yet.</p>
            ) : (
              <div className="space-y-3">
                {audit.map((log, i) => (
                  <div key={i} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-xs font-medium text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-500">{log.performedBy?.name} - {log.role}</p>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                    {log.remarks && (
                      <p className="text-xs text-gray-600 mt-1">{log.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="space-y-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">File Status</h3>
            <Badge status={file.status} />

            {file.status === 'rework' && (
              <div className="mt-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 text-sm font-medium">
                      This file requires corrections.
                    </p>
                    <p className="text-red-600 text-xs mt-1">
                      Please review the remarks and resubmit.
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Describe corrections made..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleResubmit}
                  disabled={resubmitting}
                  className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {resubmitting ? 'Resubmitting...' : 'Resubmit File'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
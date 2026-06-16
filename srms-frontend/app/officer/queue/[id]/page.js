'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import { getFile, processGate, getFileAudit } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ProcessFilePage() {
  const [file, setFile] = useState(null)
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [remarks, setRemarks] = useState('')
  const [processing, setProcessing] = useState(false)
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

  const handleProcess = async () => {
    if (!action) {
      toast.error('Please select Pass or Fail')
      return
    }
    if (action === 'fail' && !remarks) {
      toast.error('Remarks are required when failing')
      return
    }
    setProcessing(true)
    try {
      await processGate(id, { action, remarks })
      toast.success('File processed successfully')
      router.push('/officer/queue')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process file')
    } finally {
      setProcessing(false)
    }
  }

  const passClass = action === 'pass'
    ? 'w-full py-3 rounded-lg font-medium border-2 bg-green-600 text-white border-green-600'
    : 'w-full py-3 rounded-lg font-medium border-2 border-green-600 text-green-600'

  const failClass = action === 'fail'
    ? 'w-full py-3 rounded-lg font-medium border-2 bg-red-600 text-white border-red-600'
    : 'w-full py-3 rounded-lg font-medium border-2 border-red-600 text-red-600'

  if (loading) {
    return (
      <DashboardLayout title="Process File">
        <p className="text-gray-500">Loading...</p>
      </DashboardLayout>
    )
  }

  if (!file) {
    return (
      <DashboardLayout title="Process File">
        <p className="text-red-500">File not found.</p>
      </DashboardLayout>
    )
  }

 return (
    <DashboardLayout title="Process File">
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
                <p className="text-gray-500">Surveyor</p>
                <p className="font-medium">{file.surveyorId?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Current Stage</p>
                <Badge status={file.currentStage} />
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge status={file.status} />
              </div>
              <div>
                <p className="text-gray-500">Submitted</p>
                <p>{new Date(file.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Workflow Stages</h3>
            <div className="space-y-3">
              {file.stages.map((stage, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{stage.name}</p>
                    {stage.remarks && (
                      <p className="text-xs text-gray-500 mt-1">{stage.remarks}</p>
                    )}
                  </div>
                  <Badge status={stage.status} />
                </div>
              ))}
            </div>
          </div>

          {file.documents && file.documents.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Documents</h3>
              <div className="space-y-2">
                {file.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-blue-900 font-medium text-sm">DOC</span>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-900 hover:underline">
                      {doc.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="space-y-6">

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Process Gate</h3>
            <p className="text-sm text-gray-500 mb-4">
              Current stage: <strong>{file.currentStage}</strong>
            </p>
            <div className="space-y-3 mb-4">
              <button onClick={() => setAction('pass')} className={passClass}>
                Pass
              </button>
              <button onClick={() => setAction('fail')} className={failClass}>
                Fail
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Add remarks..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleProcess}
              disabled={processing || !action}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Submit Decision'}
            </button>
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
      </div>
    </DashboardLayout>
  )
}
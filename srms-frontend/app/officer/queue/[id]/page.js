'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import WorkflowTimeline from '@/components/workflow/WorkflowTimeline'
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

  if (loading) {
    return (
      <DashboardLayout title="Process File">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
          <div className="h-3 bg-slate-100 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!file) {
    return (
      <DashboardLayout title="Process File">
        <p className="text-rose-500">File not found.</p>
      </DashboardLayout>
    )
  }

  const passClass =
    action === 'pass'
      ? 'w-full py-3 rounded-lg font-medium border-2 bg-emerald-600 text-white border-emerald-600'
      : 'w-full py-3 rounded-lg font-medium border-2 border-emerald-600 text-emerald-600'

  const failClass =
    action === 'fail'
      ? 'w-full py-3 rounded-lg font-medium border-2 bg-rose-600 text-white border-rose-600'
      : 'w-full py-3 rounded-lg font-medium border-2 border-rose-600 text-rose-600'

  return (
    <DashboardLayout title="Process File">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">File information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Plot number</p>
                <p className="font-bold text-indigo-700 font-mono text-sm">
                  {file.plotNumber}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Survey record</p>
                <p className="font-bold text-indigo-700 font-mono text-sm">
                  {file.surveyRecordNumber}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Surveyor</p>
                <p className="font-medium">{file.surveyorId?.name}</p>
              </div>

              <div>
                <p className="text-slate-500">Current stage</p>
                <Badge status={file.currentStage} />
              </div>

              <div>
                <p className="text-slate-500">Status</p>
                <Badge status={file.status} />
              </div>

              <div>
                <p className="text-slate-500">Submitted</p>
                <p>{new Date(file.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-5">
              Workflow progress
            </h3>

            <WorkflowTimeline
              stages={file.stages}
              currentStage={file.currentStage}
              overallStatus={file.status}
            />
          </div>

          {file.documents && file.documents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Documents</h3>

              <div className="space-y-2">
                {file.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <span className="text-indigo-700 font-medium text-xs bg-indigo-50 px-2 py-1 rounded">
                      DOC
                    </span>

                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-700 hover:underline"
                    >
                      {doc.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="space-y-6">

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Process gate</h3>

            <p className="text-sm text-slate-500 mb-4">
              Current stage:{' '}
              <strong className="text-slate-700">{file.currentStage}</strong>
            </p>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => setAction('pass')}
                className={passClass}
              >
                Pass
              </button>

              <button
                onClick={() => setAction('fail')}
                className={failClass}
              >
                Fail
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Remarks
              </label>

              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Add remarks..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleProcess}
              disabled={processing || !action}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Submit decision'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Audit trail</h3>

            {audit.length === 0 ? (
              <p className="text-slate-500 text-sm">No actions yet.</p>
            ) : (
              <div className="space-y-3">
                {audit.map((log, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-indigo-200 pl-3"
                  >
                    <p className="text-xs font-medium text-slate-800">
                      {log.action}
                    </p>

                    <p className="text-xs text-slate-500">
                      {log.performedBy?.name} - {log.role}
                    </p>

                    <p className="text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>

                    {log.remarks && (
                      <p className="text-xs text-slate-600 mt-1">
                        {log.remarks}
                      </p>
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
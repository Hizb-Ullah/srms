'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import WorkflowTimeline from '@/components/workflow/WorkflowTimeline'
import { getFile, processGate, getFileAudit } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { FileText, ExternalLink, RotateCcw } from 'lucide-react'

export default function ProcessFilePage() {
  const [file, setFile] = useState(null)
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [remarks, setRemarks] = useState('')
  const [processing, setProcessing] = useState(false)
  const [changing, setChanging] = useState(false)

  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    fetchFile()
  }, [id])

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

  const handleChangeDecision = async (newAction) => {
    if (!remarks) {
      toast.error('Please add remarks explaining why you are changing the decision')
      return
    }

    setChanging(true)

    try {
      await processGate(id, {
        action: newAction,
        remarks,
        overrideDecision: true,
      })

      toast.success('Decision updated successfully')
      fetchFile()
      setAction('')
      setRemarks('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change decision')
    } finally {
      setChanging(false)
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
      : 'w-full py-3 rounded-lg font-medium border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'

  const failClass =
    action === 'fail'
      ? 'w-full py-3 rounded-lg font-medium border-2 bg-rose-600 text-white border-rose-600'
      : 'w-full py-3 rounded-lg font-medium border-2 border-rose-600 text-rose-600 hover:bg-rose-50'

  const currentStageData = file.stages?.find(
    (s) => s.name === file.currentStage
  )

  const alreadyDecided =
    currentStageData && currentStageData.status !== 'pending'

  return (
    <DashboardLayout title="Process File">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* File Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">
              File information
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Plot number</p>
                <p className="font-bold text-indigo-700 font-mono">
                  {file.plotNumber}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Survey record</p>
                <p className="font-bold text-indigo-700 font-mono">
                  {file.surveyRecordNumber}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Surveyor</p>
                <p className="font-medium">{file.surveyorId?.name}</p>
              </div>

              <div>
                <p className="text-slate-500">Surveyor email</p>
                <p className="text-slate-600">{file.surveyorId?.email}</p>
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

              <div>
                <p className="text-slate-500">Last updated</p>
                <p>{new Date(file.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Documents</h3>

            {file.documents && file.documents.length > 0 ? (
              <div className="space-y-2">
                {file.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium">
                        <FileText size={14} />
                      </div>

                      <span className="text-sm text-slate-700 group-hover:text-indigo-700">
                        {doc.name}
                      </span>
                    </div>

                    <ExternalLink
                      size={14}
                      className="text-slate-400 group-hover:text-indigo-600"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                No documents uploaded.
              </p>
            )}
          </div>

          {/* Workflow Timeline */}
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

          {/* Audit Trail */}
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
                      <p className="text-xs text-slate-600 mt-1 italic">
                        {log.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">
              {alreadyDecided ? 'Change decision' : 'Process gate'}
            </h3>

            {alreadyDecided && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                <RotateCcw
                  size={16}
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                />

                <p className="text-amber-700 text-xs">
                  You already made a decision on this stage. You can change it
                  below — remarks are required.
                </p>
              </div>
            )}

            <p className="text-sm text-slate-500 mb-4">
              Current stage:{' '}
              <strong className="text-slate-700">
                {file.currentStage}
              </strong>
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
                Remarks{' '}
                {(action === 'fail' || alreadyDecided) && (
                  <span className="text-rose-500">*</span>
                )}
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
              disabled={
                processing ||
                !action ||
                file.status === 'archived'
              }
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Submit decision'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
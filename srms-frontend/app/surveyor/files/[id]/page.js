'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import WorkflowTimeline from '@/components/workflow/WorkflowTimeline'
import DocumentViewer from '@/components/ui/DocumentViewer'
import { getFile, getFileAudit, resubmitFile, appealFile } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function FileDetailPage() {
  const [file, setFile] = useState(null)
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [remarks, setRemarks] = useState('')
  const [appealRemarks, setAppealRemarks] = useState('')
  const [resubmitting, setResubmitting] = useState(false)
  const [appealing, setAppealing] = useState(false)
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

  const handleAppeal = async () => {
    setAppealing(true)
    try {
      await appealFile(id, { remarks: appealRemarks })
      toast.success('Appeal submitted successfully')
      fetchFile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit appeal')
    } finally {
      setAppealing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="File Details">
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
      <DashboardLayout title="File Details">
        <p className="text-rose-500">File not found.</p>
      </DashboardLayout>
    )
  }

  const isEditable = ['submitted', 'rework'].includes(file.status)
  const isRejected = file.status === 'rejected'
  const canAppeal = isRejected && file.appealCount < 1

  return (
    <DashboardLayout title="File Details">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">File information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Plot number</p>
                <p className="font-bold text-indigo-700 font-mono">{file.plotNumber}</p>
              </div>
              <div>
                <p className="text-slate-500">Survey record</p>
                <p className="font-bold text-indigo-700 font-mono">{file.surveyRecordNumber}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <Badge status={file.status} />
              </div>
              <div>
                <p className="text-slate-500">Current stage</p>
                <Badge status={file.currentStage} />
              </div>
              <div>
                <p className="text-slate-500">Submitted</p>
                <p>{new Date(file.createdAt).toLocaleDateString()}</p>
              </div>
              {file.rejectionRemarks && (
                <div className="col-span-2">
                  <p className="text-slate-500">Rejection reason</p>
                  <p className="text-rose-600 text-sm mt-1">{file.rejectionRemarks}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Documents</h3>
            <DocumentViewer
              documents={file.documents}
              fileId={file._id}
              canEdit={isEditable}
              onDocumentDeleted={fetchFile}
              onDocumentsAdded={fetchFile}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-5">Workflow progress</h3>
            <WorkflowTimeline
              stages={file.stages}
              currentStage={file.currentStage}
              overallStatus={file.status}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Audit trail</h3>
            {audit.length === 0 ? (
              <p className="text-slate-500 text-sm">No actions yet.</p>
            ) : (
              <div className="space-y-3">
                {audit.map((log, i) => (
                  <div key={i} className="border-l-2 border-indigo-200 pl-3">
                    <p className="text-xs font-medium text-slate-800">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.performedBy?.name} - {log.role}</p>
                    <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                    {log.remarks && <p className="text-xs text-slate-600 mt-1 italic">{log.remarks}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-2">File status</h3>
            <Badge status={file.status} />

            {file.status === 'rework' && (
              <div className="mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-700 text-sm font-medium">This file requires corrections.</p>
                    <p className="text-amber-600 text-xs mt-1">Review the remarks, make corrections, then resubmit.</p>
                  </div>
                </div>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Describe corrections made..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                />
                <button
                  onClick={handleResubmit}
                  disabled={resubmitting}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {resubmitting ? 'Resubmitting...' : 'Resubmit file'}
                </button>
              </div>
            )}

            {isRejected && (
              <div className="mt-4">
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
                  <p className="text-rose-700 text-sm font-medium">File has been rejected.</p>
                  {file.rejectionRemarks && (
                    <p className="text-rose-600 text-xs mt-1">Reason: {file.rejectionRemarks}</p>
                  )}
                  {file.appealCount >= 1 && (
                    <p className="text-rose-500 text-xs mt-2 font-medium">Appeal already used — no further action available.</p>
                  )}
                </div>

                {canAppeal && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-blue-700 text-xs font-medium">You can appeal this rejection once.</p>
                      <p className="text-blue-600 text-xs mt-1">File will be returned to processing if appeal is submitted.</p>
                    </div>
                    <textarea
                      value={appealRemarks}
                      onChange={(e) => setAppealRemarks(e.target.value)}
                      rows={3}
                      placeholder="Reason for appeal..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    />
                    <button
                      onClick={handleAppeal}
                      disabled={appealing || !appealRemarks}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} />
                      {appealing ? 'Submitting...' : 'Submit appeal'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
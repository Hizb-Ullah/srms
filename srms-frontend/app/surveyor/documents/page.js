'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { getMyFiles, deleteDocument, updateFile } from '@/lib/api'
import toast from 'react-hot-toast'
import { FileText, Eye, Trash2, Upload, X, ExternalLink } from 'lucide-react'

function getViewableUrl(url) {
  if (!url) return url
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/fl_attachment:false/')
  }
  return url
}

function isPDF(url) {
  return url?.toLowerCase().includes('.pdf') || url?.toLowerCase().includes('pdf')
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp)/i.test(url)
}

export default function SurveyorDocumentsPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [uploadingFor, setUploadingFor] = useState(null)
  const [newDoc, setNewDoc] = useState(null)

  useEffect(() => {
    fetchFiles()
  }, [])

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

  const handleDelete = async (fileId, docIndex) => {
    if (!window.confirm('Delete this document?')) return
    setDeleting(`${fileId}-${docIndex}`)
    try {
      await deleteDocument(fileId, docIndex)
      toast.success('Document deleted')
      fetchFiles()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const handleUpload = async (fileId) => {
    if (!newDoc) return
    setUploadingFor(fileId)
    try {
      const formData = new FormData()
      formData.append('documents', newDoc)
      await updateFile(fileId, formData)
      toast.success('Document uploaded')
      setNewDoc(null)
      setUploadingFor(null)
      fetchFiles()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload')
      setUploadingFor(null)
    }
  }

  const allDocuments = files.flatMap(file =>
    (file.documents || []).map((doc, i) => ({
      ...doc,
      fileId: file._id,
      plotNumber: file.plotNumber,
      fileStatus: file.status,
      docIndex: i,
      canEdit: ['submitted', 'rework'].includes(file.status)
    }))
  )

  return (
    <DashboardLayout title="My Documents">
      <div className="space-y-4">

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : allDocuments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
            <FileText size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No documents uploaded yet.</p>
          </div>
        ) : (
          allDocuments.map((doc, i) => {
            const viewUrl = getViewableUrl(doc.url)
            const deleteKey = `${doc.fileId}-${doc.docIndex}`
            return (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <FileText size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{doc.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{doc.plotNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelected({ ...doc, viewUrl })}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition"
                    >
                      <Eye size={13} /> View
                    </button>
                    <a
                    
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-medium px-3 py-2 rounded-lg hover:bg-slate-200 transition"
                    >
                      <ExternalLink size={13} /> Open
                    </a>
                    {doc.canEdit && (
                      <button
                        onClick={() => handleDelete(doc.fileId, doc.docIndex)}
                        disabled={deleting === deleteKey}
                        className="flex items-center gap-1.5 bg-rose-500 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-rose-600 active:scale-95 transition disabled:opacity-50"
                      >
                        <Trash2 size={13} /> {deleting === deleteKey ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>

                {doc.canEdit && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Replace or add document for this file:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setNewDoc(e.target.files[0])}
                        className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                      />
                      <button
                        onClick={() => handleUpload(doc.fileId)}
                        disabled={!newDoc || uploadingFor === doc.fileId}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                      >
                        <Upload size={13} /> {uploadingFor === doc.fileId ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Viewer Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-indigo-600" />
                <p className="font-medium text-slate-800 text-sm">{selected.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <a href={selected.viewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <ExternalLink size={13} /> Open in new tab
                </a>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {isPDF(selected.url) ? (
                <iframe src={selected.viewUrl} className="w-full h-full" style={{ minHeight: '80vh' }} title={selected.name} />
              ) : isImage(selected.url) ? (
                <div className="flex items-center justify-center p-6" style={{ minHeight: '80vh' }}>
                  <img src={selected.viewUrl} alt={selected.name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '80vh' }}>
                  <FileText size={48} className="text-slate-300" />
                  <p className="text-slate-500 text-sm">Cannot preview this file type.</p>
                  <a href={selected.viewUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2">
                    <ExternalLink size={15} /> Open in browser
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
'use client'

import { useState } from 'react'
import { X, FileText, ExternalLink, Eye, Trash2, Upload } from 'lucide-react'

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

export default function DocumentViewer({
  documents,
  fileId,
  canEdit,
  onDocumentDeleted,
  onDocumentsAdded
}) {
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [newDocs, setNewDocs] = useState([])
  const [uploading, setUploading] = useState(false)

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    setDeleting(index)
    try {
      const { deleteDocument } = await import('@/lib/api')
      await deleteDocument(fileId, index)
      if (onDocumentDeleted) onDocumentDeleted()
    } catch (error) {
      alert('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  const handleUpload = async () => {
    if (newDocs.length === 0) return
    setUploading(true)
    try {
      const { updateFile } = await import('@/lib/api')
      const formData = new FormData()
      newDocs.forEach(doc => formData.append('documents', doc))
      await updateFile(fileId, formData)
      setNewDocs([])
      if (onDocumentsAdded) onDocumentsAdded()
    } catch (error) {
      alert('Failed to upload documents')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {(!documents || documents.length === 0) && !canEdit && (
        <p className="text-slate-400 text-sm">No documents uploaded.</p>
      )}

      {documents && documents.length > 0 && (
        <div className="space-y-2 mb-4">
          {documents.map((doc, i) => {
            const viewUrl = getViewableUrl(doc.url)
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={16} className="text-indigo-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={() => setSelected({ ...doc, viewUrl })}
                    className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition active:scale-95"
                  >
                    <Eye size={13} /> View
                  </button>
                  <a
                  
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <ExternalLink size={13} /> Open
                  </a>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(i)}
                      disabled={deleting === i}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 size={13} /> {deleting === i ? '...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canEdit && (
        <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
          <p className="text-sm font-medium text-slate-600 mb-2">Upload new documents</p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setNewDocs(Array.from(e.target.files))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white mb-2"
          />
          {newDocs.length > 0 && (
            <div className="mb-3 space-y-1">
              {newDocs.map((doc, i) => (
                <p key={i} className="text-xs text-slate-600 flex items-center gap-1">
                  <FileText size={12} className="text-indigo-500" /> {doc.name}
                </p>
              ))}
            </div>
          )}
          <button
        
            onClick={handleUpload}
            disabled={uploading || newDocs.length === 0}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Upload documents'}
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-indigo-600" />
                <p className="font-medium text-slate-800 text-sm">{selected.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                
                  href={selected.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={13} /> Open in new tab
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {isPDF(selected.url) ? (
                <iframe
                  src={selected.viewUrl}
                  className="w-full h-full"
                  style={{ minHeight: '80vh' }}
                  title={selected.name}
                />
              ) : isImage(selected.url) ? (
                <div className="flex items-center justify-center p-6 overflow-auto" style={{ minHeight: '80vh' }}>
                  <img
                    src={selected.viewUrl}
                    alt={selected.name}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '80vh' }}>
                  <FileText size={48} className="text-slate-300" />
                  <p className="text-slate-500 text-sm">This file type cannot be previewed inline.</p>
                  <a
                  
                    href={selected.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    <ExternalLink size={15} /> Open in browser
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { getAllFiles } from '@/lib/api'
import toast from 'react-hot-toast'
import { FileText, Eye, ExternalLink, X } from 'lucide-react'

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

export default function ApproverDocumentsPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await getAllFiles()
        setFiles(res.data.data)
      } catch {
        toast.error('Failed to load documents')
      } finally {
        setLoading(false)
      }
    }
    fetchFiles()
  }, [])

  const allDocuments = files.flatMap(file =>
    (file.documents || []).map((doc, i) => ({
      ...doc,
      plotNumber: file.plotNumber,
      surveyorName: file.surveyorId?.name,
      fileStatus: file.status,
      docIndex: i
    }))
  )

  return (
    <DashboardLayout title="All Documents">
      <div className="space-y-3">
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : allDocuments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
            <FileText size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No documents found.</p>
          </div>
        ) : (
          allDocuments.map((doc, i) => {
            const viewUrl = getViewableUrl(doc.url)
            return (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-50 p-2 rounded-lg">
                    <FileText size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{doc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-mono">{doc.plotNumber}</span> · {doc.surveyorName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelected({ ...doc, viewUrl })}
                    className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-violet-700 active:scale-95 transition"
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
                </div>
              </div>
            )
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-violet-600" />
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

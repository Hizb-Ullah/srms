'use client'

import { useState } from 'react'
import { X, FileText, ExternalLink, Eye } from 'lucide-react'

function isPDF(url) {
  return url?.toLowerCase().includes('.pdf') || url?.toLowerCase().includes('pdf')
}

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url || '')
}

export default function DocumentViewer({ documents }) {
  const [selected, setSelected] = useState(null)

  if (!documents || documents.length === 0) {
    return <p className="text-slate-400 text-sm">No documents uploaded.</p>
  }

  return (
    <div>
      <div className="space-y-2">
        {documents.map((doc, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-transparent hover:border-indigo-200 hover:bg-indigo-50 transition"
          >
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-indigo-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">{doc.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(doc)}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition"
              >
                <Eye size={13} />
                View
              </button>

              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
              >
                <ExternalLink size={13} />
                Open
              </a>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-indigo-600" />
                <p className="font-medium text-slate-800 text-sm">
                  {selected.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  Open in new tab
                </a>

                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50">
              {isPDF(selected.url) ? (
                <iframe
                  src={selected.url}
                  className="w-full h-full min-h-[70vh]"
                  title={selected.name}
                />
              ) : isImage(selected.url) ? (
                <div className="flex items-center justify-center p-6 min-h-[70vh]">
                  <img
                    src={selected.url}
                    alt={selected.name}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                  <FileText size={48} className="text-slate-300" />

                  <p className="text-slate-500 text-sm">
                    This file type cannot be previewed inline.
                  </p>

                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    <ExternalLink size={15} />
                    Open file
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
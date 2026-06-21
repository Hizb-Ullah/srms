'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 animate-[fadeIn_0.15s_ease-out]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
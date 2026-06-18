'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'

export default function TopBar({ title }) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        {title && (
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        )}
      </div>
      <button
        onClick={() => router.push('/dashboard-redirect')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition"
      >
        <Home size={16} /> Home
      </button>
    </div>
  )
}
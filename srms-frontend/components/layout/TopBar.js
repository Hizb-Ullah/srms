'use client'

import { useRouter } from 'next/navigation'
import { Home } from 'lucide-react'

export default function TopBar({ title }) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div />
      <button
        onClick={() => router.push('/dashboard-redirect')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition"
      >
        <Home size={16} /> Home
      </button>
    </div>
  )
}
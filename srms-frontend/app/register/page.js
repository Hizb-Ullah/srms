'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-50 text-amber-600 p-4 rounded-full">
            <ShieldAlert size={36} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Account Creation Restricted</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Self-registration is disabled. Only the system administrator can create accounts.
          Please contact your administrator to get access.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 active:scale-[0.98] transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}

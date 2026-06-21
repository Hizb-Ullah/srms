'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestPasswordReset } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await requestPasswordReset({ email })
      toast.success(res.data.message)
      setSubmitted(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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

      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 w-full max-w-md p-8">

        <div className="text-center mb-8">
          <div className="bg-indigo-50 text-indigo-600 rounded-2xl p-4 mb-4 inline-block">
            <KeyRound size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Forgot password
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            Submit a request and an administrator will reset your password
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-3" />
            <p className="text-emerald-800 font-medium text-sm">
              Request submitted successfully
            </p>
            <p className="text-emerald-600 text-xs mt-1">
              An administrator will contact you once your password has been reset.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your registered email"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
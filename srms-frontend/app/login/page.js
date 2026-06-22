'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser({ email, password })
      login(res.data.token, res.data.user)
      toast.success('Login successful')

      const role = res.data.user.role
      if (role === 'surveyor')  router.push('/surveyor')
      if (role === 'officer')   router.push('/officer')
      if (role === 'approver')  router.push('/approver')
      if (role === 'admin')     router.push('/admin')

    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 w-full max-w-md p-8 hover:shadow-2xl hover:shadow-indigo-100 transition">

        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-4 mb-4 inline-block shadow-lg shadow-indigo-200">
            <h1 className="text-xl font-bold">SRMS</h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            Survey Record Management System
          </h2>
          <p className="text-slate-400 mt-1">
            Sign in to your account
          </p>
        </div>

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
              placeholder="Enter your email"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-600">
                Password
              </label>
              <a href="/forgot-password" className="text-xs text-indigo-600 hover:underline font-medium">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-indigo-600 font-medium hover:underline">
            Create Account
          </a>
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-center text-slate-400 text-xs mb-2">Quick access</p>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@dsm.gov.pk')
              setPassword('Admin@123')
            }}
            className="w-full border border-slate-200 text-slate-500 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
          >
            Fill admin credentials
          </button>
        </div>

        <p className="text-center text-slate-300 text-xs mt-3">
          Secure Access Only
        </p>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

const USER_TYPES = [
  { value: '', label: 'Select user type' },
  { value: 'admin', label: 'Admin' },
  { value: 'dsm', label: 'DSM Employee' },
  { value: 'private', label: 'Private Surveyor' },
  { value: 'landboard', label: 'Land Board Surveyor' },
  { value: 'officer', label: 'Officer' },
  { value: 'approver', label: 'Approver' },
  { value: 'surveyor', label: 'Surveyor' },
]

// User types that require a surveyor registration number
const REQUIRES_CODE = ['private', 'landboard']

export default function LoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [surveyorCode, setSurveyorCode] = useState('')
  const [userType, setUserType]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]       = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userType) return toast.error('Please select your user type')
    setLoading(true)
    try {
      const payload = { email, password }
      if (REQUIRES_CODE.includes(userType)) {
        if (!surveyorCode) return toast.error('Surveyor registration number is required')
        payload.surveyorCode = surveyorCode
      }
      const res = await loginUser(payload)
      login(res.data.token, res.data.user)
      toast.success('Login successful')

      const { role, group } = res.data.user
      if (group === 'Private' || group === 'LandBoard') router.push('/surveyor/lot-requests')
      else if (group === 'DSM') router.push('/lot-allocator')
      else if (role === 'surveyor') router.push('/surveyor')
      else if (role === 'officer') router.push('/officer')
      else if (role === 'approver') router.push('/approver')
      else if (role === 'admin' || role === 'director') router.push('/admin')
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

      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-4 mb-4 inline-block shadow-lg shadow-indigo-200">
            <h1 className="text-xl font-bold">SRMS</h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Survey Record Management System</h2>
          <p className="text-slate-400 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">User Type</label>
            <select
              value={userType}
              onChange={e => setUserType(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            >
              {USER_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-600">Password</label>
              <a href="/forgot-password" className="text-xs text-indigo-600 hover:underline font-medium">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          {REQUIRES_CODE.includes(userType) && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Surveyor Registration Number</label>
              <input
                type="number"
                value={surveyorCode}
                onChange={e => setSurveyorCode(e.target.value)}
                required
                placeholder="Enter your registration number"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <p className="text-center text-slate-400 text-xs">Quick access</p>
          <button
            type="button"
            onClick={() => { setEmail('admin@dsm.gov.pk'); setPassword('Admin@123'); setUserType('admin') }}
            className="w-full border border-slate-200 text-slate-500 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
          >
            Fill admin credentials
          </button>
          <a
            href="/admin-credentials"
            className="block text-center text-xs text-indigo-500 hover:underline"
          >
            Admin setup / forgot admin credentials
          </a>
        </div>

        <p className="text-center text-slate-300 text-xs mt-3">Secure Access Only</p>
      </div>
    </div>
  )
}

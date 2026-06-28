'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkAdminExists, registerUser } from '@/lib/api'
import toast from 'react-hot-toast'
import { ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function AdminCredentialsPage() {
  const [checking, setChecking] = useState(true)
  const [adminExists, setAdminExists] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: 'System Administrator',
    email: 'admin@dsm.gov.pk',
    password: 'Admin@123',
    role: 'admin'
  })
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      try {
        const res = await checkAdminExists()
        setAdminExists(res.data.exists)
      } catch {
        setAdminExists(false)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await registerUser(form)
      toast.success('Admin account created successfully')
      router.push('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin')
    } finally {
      setCreating(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Checking...</p>
      </div>
    )
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

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-8">

        <div className="text-center mb-8">
          <div className="bg-indigo-50 text-indigo-600 rounded-2xl p-4 mb-4 inline-block">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Setup</h2>
        </div>

        {adminExists ? (
          <div className="text-center space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-emerald-700 font-medium mb-2">Admin account exists</p>
              <p className="text-emerald-600 text-sm">Default credentials:</p>
              <p className="font-mono text-sm mt-2 text-slate-700">admin@dsm.gov.pk</p>
              <p className="font-mono text-sm text-slate-700">Admin@123</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-700 text-sm font-medium">No admin account found.</p>
              <p className="text-amber-600 text-xs mt-1">Create the admin account below.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Admin name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create admin account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
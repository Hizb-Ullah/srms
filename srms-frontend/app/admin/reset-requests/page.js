'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Modal from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getResetRequests, resetUserPassword, resolveResetRequest } from '@/lib/api'
import toast from 'react-hot-toast'
import { KeyRound, Eye, EyeOff, Inbox } from 'lucide-react'

export default function ResetRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [resetOpen, setResetOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await getResetRequests()
      setRequests(res.data.data)
    } catch (error) {
      toast.error('Failed to load reset requests')
    } finally {
      setLoading(false)
    }
  }

  const openReset = (request) => {
    setSelected(request)
    setNewPassword('')
    setShowPassword(false)
    setResetOpen(true)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!selected.userId) {
      toast.error('This user no longer exists')
      return
    }
    setSubmitting(true)
    try {
      await resetUserPassword(selected.userId._id, { newPassword })
      await resolveResetRequest(selected._id)
      toast.success('Password reset and request resolved')
      setResetOpen(false)
      fetchRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="Password Reset Requests">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Pending requests</h3>

        {loading ? (
          <TableSkeleton rows={3} />
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Inbox size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No pending reset requests.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Requested</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium">{req.userId?.name || '—'}</td>
                  <td className="py-3">{req.email}</td>
                  <td className="py-3 capitalize">{req.userId?.role || '—'}</td>
                  <td className="py-3 text-slate-500">
                    {new Date(req.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => openReset(req)}
                      className="flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 active:scale-95 transition"
                    >
                      <KeyRound size={13} /> Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset password — ${selected?.userId?.name || selected?.email || ''}`}>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 active:scale-[0.98] transition disabled:opacity-50"
          >
            {submitting ? 'Resetting...' : 'Reset password & resolve'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
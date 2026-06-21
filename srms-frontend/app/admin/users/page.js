'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import {
  getAllUsers, createUser, updateUser, deleteUser,
  toggleUserLock, resetUserPassword
} from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'surveyor' })
  const [resetPassword, setResetPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers()
      setUsers(res.data.data)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLock = async (id) => {
    try {
      const res = await toggleUserLock(id)
      toast.success(res.data.message)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', role: 'surveyor' })
    setShowPassword(false)
    setCreateOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createUser(form)
      toast.success('User created successfully')
      setCreateOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (user) => {
    setSelectedUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setEditOpen(true)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateUser(selectedUser._id, {
        name: form.name,
        email: form.email,
        role: form.role
      })
      toast.success('User updated successfully')
      setEditOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  const openReset = (user) => {
    setSelectedUser(user)
    setResetPassword('')
    setShowPassword(false)
    setResetOpen(true)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await resetUserPassword(selectedUser._id, { newPassword: resetPassword })
      toast.success(res.data.message)
      setResetOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  const openDelete = (user) => {
    setSelectedUser(user)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await deleteUser(selectedUser._id)
      toast.success('User deleted successfully')
      setDeleteOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="Manage Users">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">All users</h3>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition"
          >
            <Plus size={16} /> Add user
          </button>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Last login</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium">{user.name}</td>
                  <td className="py-3">{user.email}</td>
                  <td className="py-3"><Badge status={user.role} /></td>
                  <td className="py-3">
                    <span className={user.isLocked ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
                      {user.isLocked ? 'Locked' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => openReset(user)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition"
                        title="Reset password"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleLock(user._id)}
                        className={user.isLocked
                          ? 'bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-emerald-100 transition'
                          : 'bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-rose-100 transition'
                        }
                      >
                        {user.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => openDelete(user)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add new user">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="surveyor">Surveyor</option>
              <option value="officer">Officer</option>
              <option value="approver">Approver</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create user'}
          </button>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit user">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={selectedUser?.role === 'admin'}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="surveyor">Surveyor</option>
              <option value="officer">Officer</option>
              <option value="approver">Approver</option>
              {selectedUser?.role === 'admin' && <option value="admin">Admin</option>}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset password — ${selectedUser?.name || ''}`}>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
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
            {submitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete user">
        <p className="text-sm text-slate-600 mb-5">
          Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteOpen(false)}
            className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-700 active:scale-[0.98] transition disabled:opacity-50"
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
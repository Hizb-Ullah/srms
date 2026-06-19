'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getAllUsers, toggleUserLock } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <DashboardLayout title="Manage Users">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">All users</h3>
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
                <th className="pb-3">Action</th>
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
                    <button
                      onClick={() => handleToggleLock(user._id)}
                      className={user.isLocked
                        ? 'bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 active:scale-95 transition'
                        : 'bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-700 active:scale-95 transition'
                      }
                    >
                      {user.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
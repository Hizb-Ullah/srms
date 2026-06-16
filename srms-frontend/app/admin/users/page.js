'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
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
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">All Users</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Last Login</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{user.name}</td>
                  <td className="py-3">{user.email}</td>
                  <td className="py-3"><Badge status={user.role} /></td>
                  <td className="py-3">
                    <span className={user.isLocked ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {user.isLocked ? 'Locked' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleToggleLock(user._id)}
                      className={user.isLocked
                        ? 'bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700'
                        : 'bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700'
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
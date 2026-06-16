'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { getDashboard } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Users, FolderOpen, Hash } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboard()
        setStats(res.data.data)
      } catch (error) {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <DashboardLayout title="Admin Dashboard">
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard title="Total Users" value={stats?.totalUsers} icon={<Users size={20} />}     color="bg-blue-100 text-blue-900" />
            <StatCard title="Total Files" value={stats?.totalFiles} icon={<FolderOpen size={20} />} color="bg-purple-100 text-purple-900" />
            <StatCard title="Total Plots" value={stats?.totalPlots} icon={<Hash size={20} />}       color="bg-green-100 text-green-900" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => router.push('/admin/users')}
              className="bg-white p-6 rounded-xl shadow text-left hover:shadow-md transition flex items-start gap-3"
            >
              <Users size={24} className="text-blue-900" />
              <div>
                <p className="font-semibold">Manage Users</p>
                <p className="text-gray-500 text-sm">View, lock, unlock users</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/admin/files')}
              className="bg-white p-6 rounded-xl shadow text-left hover:shadow-md transition flex items-start gap-3"
            >
              <FolderOpen size={24} className="text-blue-900" />
              <div>
                <p className="font-semibold">All Files</p>
                <p className="text-gray-500 text-sm">View all submitted files</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/admin/audit')}
              className="bg-white p-6 rounded-xl shadow text-left hover:shadow-md transition flex items-start gap-3"
            >
              <Hash size={24} className="text-blue-900" />
              <div>
                <p className="font-semibold">Audit Logs</p>
                <p className="text-gray-500 text-sm">Complete action history</p>
              </div>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Files</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3">Plot Number</th>
                  <th className="pb-3">Surveyor</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentFiles?.map((file) => (
                  <tr key={file._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{file.plotNumber}</td>
                    <td className="py-3">{file.surveyorId?.name}</td>
                    <td className="py-3"><Badge status={file.status} /></td>
                    <td className="py-3 text-gray-500">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
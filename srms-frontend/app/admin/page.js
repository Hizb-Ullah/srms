'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total users" value={stats?.totalUsers} icon={<Users size={20} className="text-indigo-700" />}     color="bg-indigo-50" />
        <StatCard title="Total files" value={stats?.totalFiles} icon={<FolderOpen size={20} className="text-violet-700" />} color="bg-violet-50" />
        <StatCard title="Total plots" value={stats?.totalPlots} icon={<Hash size={20} className="text-emerald-700" />}       color="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-left hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all flex items-start gap-3"
        >
          <Users size={22} className="text-indigo-600" />
          <div>
            <p className="font-semibold text-slate-800">Manage users</p>
            <p className="text-slate-500 text-sm">View, lock, unlock users</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/admin/files')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-left hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all flex items-start gap-3"
        >
          <FolderOpen size={22} className="text-indigo-600" />
          <div>
            <p className="font-semibold text-slate-800">All files</p>
            <p className="text-slate-500 text-sm">View all submitted files</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/admin/audit')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-left hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all flex items-start gap-3"
        >
          <Hash size={22} className="text-indigo-600" />
          <div>
            <p className="font-semibold text-slate-800">Audit logs</p>
            <p className="text-slate-500 text-sm">Complete action history</p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Recent files</h3>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Plot number</th>
                <th className="pb-3">Surveyor</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentFiles?.map((file) => (
                <tr key={file._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium font-mono text-xs">{file.plotNumber}</td>
                  <td className="py-3">{file.surveyorId?.name}</td>
                  <td className="py-3"><Badge status={file.status} /></td>
                  <td className="py-3 text-slate-500">
                    {new Date(file.createdAt).toLocaleDateString()}
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
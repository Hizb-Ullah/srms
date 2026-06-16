'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { getMyFiles, getMyPlots } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Hash, Clock, RotateCcw, CheckCircle, FolderOpen } from 'lucide-react'

export default function SurveyorDashboard() {
  const [files, setFiles] = useState([])
  const [plots, setPlots] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filesRes, plotsRes] = await Promise.all([
          getMyFiles(),
          getMyPlots()
        ])
        setFiles(filesRes.data.data)
        setPlots(plotsRes.data.data)
      } catch (error) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const inProgress = files.filter(f => !['submitted','archived','rework'].includes(f.status)).length
  const rework      = files.filter(f => f.status === 'rework').length
  const archived     = files.filter(f => f.status === 'archived').length

  return (
    <DashboardLayout title="Surveyor Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Plots"  value={plots.length} icon={<Hash size={20} />}      color="bg-blue-100 text-blue-900" />
        <StatCard title="In Progress"  value={inProgress}   icon={<Clock size={20} />}     color="bg-yellow-100 text-yellow-900" />
        <StatCard title="Needs Rework" value={rework}       icon={<RotateCcw size={20} />} color="bg-red-100 text-red-900" />
        <StatCard title="Archived"     value={archived}     icon={<CheckCircle size={20} />} color="bg-green-100 text-green-900" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => router.push('/surveyor/request')}
          className="bg-blue-900 text-white p-6 rounded-xl text-left hover:bg-blue-800 transition flex items-start gap-4"
        >
          <Hash size={28} />
          <div>
            <p className="font-semibold text-lg">Request Plot Number</p>
            <p className="text-blue-300 text-sm">Get a new plot & survey record number</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/surveyor/submit')}
          className="bg-white border-2 border-blue-900 text-blue-900 p-6 rounded-xl text-left hover:bg-blue-50 transition flex items-start gap-4"
        >
          <FolderOpen size={28} />
          <div>
            <p className="font-semibold text-lg">Submit File</p>
            <p className="text-gray-500 text-sm">Submit your file to DSM for processing</p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Files</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-500">No files submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Plot Number</th>
                <th className="pb-3">Survey Record</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {files.slice(0, 5).map((file) => (
                <tr key={file._id} className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/surveyor/files/${file._id}`)}>
                  <td className="py-3 font-medium">{file.plotNumber}</td>
                  <td className="py-3">{file.surveyRecordNumber}</td>
                  <td className="py-3"><Badge status={file.status} /></td>
                  <td className="py-3 text-gray-500">
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
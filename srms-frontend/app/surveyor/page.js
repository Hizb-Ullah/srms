'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
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
        <StatCard title="Total plots"  value={plots.length} icon={<Hash size={20} className="text-indigo-700" />}      color="bg-indigo-50" />
        <StatCard title="In progress"  value={inProgress}   icon={<Clock size={20} className="text-amber-700" />}     color="bg-amber-50" />
        <StatCard title="Needs rework" value={rework}       icon={<RotateCcw size={20} className="text-rose-700" />} color="bg-rose-50" />
        <StatCard title="Archived"     value={archived}     icon={<CheckCircle size={20} className="text-emerald-700" />} color="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => router.push('/surveyor/request')}
          className="bg-indigo-600 text-white p-6 rounded-xl text-left hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-start gap-4"
        >
          <Hash size={26} />
          <div>
            <p className="font-semibold text-lg">Request plot number</p>
            <p className="text-indigo-200 text-sm">Get a new plot & survey record number</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/surveyor/submit')}
          className="bg-white border border-slate-200 text-slate-800 p-6 rounded-xl text-left hover:border-indigo-300 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-start gap-4 shadow-sm"
        >
          <FolderOpen size={26} className="text-indigo-600" />
          <div>
            <p className="font-semibold text-lg">Submit file</p>
            <p className="text-slate-500 text-sm">Submit your file to DSM for processing</p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Recent files</h3>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : files.length === 0 ? (
          <p className="text-slate-500">No files submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Plot number</th>
                <th className="pb-3">Survey record</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {files.slice(0, 5).map((file) => (
                <tr key={file._id} className="border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => router.push(`/surveyor/files/${file._id}`)}>
                  <td className="py-3 font-medium font-mono text-xs">{file.plotNumber}</td>
                  <td className="py-3 font-mono text-xs">{file.surveyRecordNumber}</td>
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
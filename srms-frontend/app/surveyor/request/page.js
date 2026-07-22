'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { requestPlot, getMyPlots, deletePlot } from '@/lib/api'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Hash, FileCheck, FileX, Trash2 } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

export default function RequestNumberPage() {
  const [loading, setLoading] = useState(false)
  const [plots, setPlots] = useState([])
  const [fetching, setFetching] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetchPlots()
  }, [])

  const fetchPlots = async () => {
    try {
      const res = await getMyPlots()
      setPlots(res.data.data)
    } catch (error) {
      toast.error('Failed to load plot numbers')
    } finally {
      setFetching(false)
    }
  }

  const handleRequest = async () => {
    setLoading(true)
    try {
      await requestPlot()
      toast.success('Plot number issued successfully')
      fetchPlots()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request plot number')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (plot) => {
    if (!window.confirm(`Delete ${plot.plotNumber}? This cannot be undone.`)) return
    setDeletingId(plot._id)
    try {
      await deletePlot(plot._id)
      toast.success('Plot number deleted')
      fetchPlots()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <DashboardLayout title="Request Plot Number">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-50 text-indigo-700 p-4 rounded-full">
              <Hash size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Request plot number
          </h2>
          <p className="text-slate-500 mb-6">
            Click the button below to get a unique plot number and survey record number assigned to you.
          </p>
          <button
            onClick={handleRequest}
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? 'Requesting...' : 'Request new plot number'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Your plot numbers</h3>

          {fetching ? (
            <TableSkeleton rows={3} />
          ) : plots.length === 0 ? (
            <p className="text-slate-500 text-sm">
              You haven&apos;t requested any plot numbers yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plots.map((plot) => (
                <div
                  key={plot._id}
                  className="border border-slate-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono font-bold text-indigo-700 text-sm">{plot.plotNumber}</p>
                      <p className="font-mono text-slate-400 text-xs mt-0.5">{plot.surveyRecordNumber}</p>
                    </div>
                    {plot.fileSubmitted ? (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                        <FileCheck size={12} /> Submitted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                        <FileX size={12} /> Not submitted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Issued {new Date(plot.createdAt).toLocaleDateString()}
                  </p>
                  {!plot.fileSubmitted && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => router.push(`/surveyor/submit?plot=${plot.plotNumber}&srn=${plot.surveyRecordNumber}`)}
                        className="flex-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition"
                      >
                        Submit file for this plot
                      </button>
                      <button
                        onClick={() => handleDelete(plot)}
                        disabled={deletingId === plot._id}
                        className="p-1.5 text-rose-500 border border-rose-200 rounded-lg hover:bg-rose-50 transition disabled:opacity-50"
                        title="Delete this plot number"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
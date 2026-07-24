'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { requestPlot, getMyPlots, deletePlot } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Hash, FileCheck, FileX, Trash2, X } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

const REQUEST_TYPES = [
  { value: 'single_plot', label: 'Single Plot' },
  { value: 'trans_plot', label: 'Trans Plot' },
]

export default function RequestNumberPage() {
  const { user } = useAuth()
  const [loading, setLoading]       = useState(false)
  const [plots, setPlots]           = useState([])
  const [fetching, setFetching]     = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({
    requestType: 'single_plot',
    location: '',
    cadastreNumber: '',
    landBoard: '',
  })
  const router = useRouter()

  useEffect(() => { fetchPlots() }, [])

  const fetchPlots = async () => {
    try {
      const res = await getMyPlots()
      setPlots(res.data.data)
    } catch {
      toast.error('Failed to load plot numbers')
    } finally {
      setFetching(false)
    }
  }

  const handleRequest = async (e) => {
    e.preventDefault()
    if (!form.location) return toast.error('Location is required')
    setLoading(true)
    try {
      await requestPlot(form)
      toast.success('Plot number issued successfully')
      setShowForm(false)
      setForm({ requestType: 'single_plot', location: '', cadastreNumber: '', landBoard: '' })
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

  const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <DashboardLayout title="Request Plot Number">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Request card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-50 text-indigo-700 p-4 rounded-full">
              <Hash size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Request plot number</h2>
          <p className="text-slate-500 mb-6">
            Click the button below to fill in plot details and get a unique plot number assigned to you.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition"
          >
            Request new plot number
          </button>
        </div>

        {/* Plot details form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-800">Plot Number Details</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Request Type</label>
                  <select value={form.requestType} onChange={e => setForm({...form, requestType: e.target.value})} className={inp}>
                    {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Location (Village / Area)</label>
                  <input required type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                    placeholder="e.g. Gaborone West" className={inp} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Cadastre #</label>
                  <input type="text" value={form.cadastreNumber} onChange={e => setForm({...form, cadastreNumber: e.target.value})}
                    placeholder="Optional" className={inp} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Land Board</label>
                  <input type="text" value={form.landBoard} onChange={e => setForm({...form, landBoard: e.target.value})}
                    placeholder="e.g. Gaborone Land Board" className={inp} />
                </div>

                {/* Read-only info fields — auto-assigned by system */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs text-slate-500">
                  <p className="font-medium text-slate-600 mb-1">Auto-assigned by system:</p>
                  <p>Lot Number — assigned on submission</p>
                  <p>Surveyor Code # — <span className="font-mono text-indigo-600">{user?.surveyorCode || '—'}</span></p>
                  <p>SR # — assigned on submission</p>
                  <p>DSM # — assigned on submission</p>
                  <p>OS # — assigned on submission</p>
                  <p>Date — {new Date().toLocaleDateString()}</p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50">
                  {loading ? 'Requesting...' : 'Submit Request'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Plot list */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Your plot numbers</h3>

          {fetching ? (
            <TableSkeleton rows={3} />
          ) : plots.length === 0 ? (
            <p className="text-slate-500 text-sm">You haven&apos;t requested any plot numbers yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plots.map((plot) => (
                <div key={plot._id} className="border border-slate-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition">
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
                  <p className="text-xs text-slate-400">Issued {new Date(plot.createdAt).toLocaleDateString()}</p>
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

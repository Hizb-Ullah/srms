'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { submitFramingDataRequest, getMyFramingDataRequests } from '@/lib/api'
import toast from 'react-hot-toast'
import { Hash } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

const STATUS_LABELS = {
  received_from_surveyor: 'Received by Controller',
  sent_to_capturing: 'In Progress (with Capturing)',
  forwarded_to_surveyor: 'Forwarded to You'
}
const STATUS_COLOR = {
  received_from_surveyor: 'bg-sky-50 text-sky-700',
  sent_to_capturing: 'bg-amber-50 text-amber-700',
  forwarded_to_surveyor: 'bg-emerald-50 text-emerald-700'
}

// Per client: the surveyor enters the Lot Number and Village of the framing
// data they're requesting. Goes directly to the File Controller (not RMU),
// Controller sends to Capturing, Capturing marks it and the result
// automatically comes back to the surveyor too — same route as Shape
// File Scratch.
export default function FramingDataPage() {
  const [records, setRecords] = useState([])
  const [fetching, setFetching] = useState(true)
  const [lotNumber, setLotNumber] = useState('')
  const [village, setVillage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const res = await getMyFramingDataRequests()
      setRecords(res.data.data)
    } catch {
      toast.error('Failed to load framing data requests')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!lotNumber.trim()) return toast.error('Lot Number is required')
    if (!village.trim()) return toast.error('Village is required')
    setSubmitting(true)
    try {
      await submitFramingDataRequest({ lotNumber: lotNumber.trim(), village: village.trim() })
      toast.success('Framing data request submitted')
      setLotNumber('')
      setVillage('')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout title="Request Framing Data">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Hash size={20} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-800">Request Framing Data</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Lot Number</label>
              <input
                required
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="e.g. Lot 102 Gaborone"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Village</label>
              <input
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Gaborone"
                className={inp}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">My Framing Data Requests</h3>
          {fetching ? (
            <TableSkeleton rows={3} />
          ) : records.length === 0 ? (
            <p className="text-slate-500 text-sm">No framing data requests yet.</p>
          ) : (
            <div className="space-y-2">
              {records.map(r => (
                <div key={r._id} className="border border-slate-100 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-sm text-slate-800">{r.lotNumber}</span>
                      <span className="text-xs text-slate-400">{r.village}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      {r.capturingOutcome && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.capturingOutcome === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {r.capturingOutcome === 'passed' ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.reportUrl && (
                    <a href={r.reportUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-indigo-600 underline mt-2">
                      View Report
                    </a>
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

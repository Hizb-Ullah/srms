'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { submitFile, getMyPlots } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { FileText } from 'lucide-react'

export default function SubmitFilePage() {
  const [plots, setPlots] = useState([])
  const [selectedPlot, setSelectedPlot] = useState('')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const res = await getMyPlots()
        const unsubmitted = res.data.data.filter((p) => !p.fileSubmitted)
        setPlots(unsubmitted)

        const preselect = searchParams.get('plot')
        if (preselect && unsubmitted.some((p) => p.plotNumber === preselect)) {
          setSelectedPlot(preselect)
        } else if (unsubmitted.length > 0) {
          setSelectedPlot(unsubmitted[0].plotNumber)
        }
      } catch (error) {
        toast.error('Failed to load your plot numbers')
      } finally {
        setFetching(false)
      }
    }
    fetchPlots()
  }, [searchParams])

  const selectedPlotData = plots.find((p) => p.plotNumber === selectedPlot)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPlot) {
      toast.error('Please select a plot number')
      return
    }
    if (documents.length === 0) {
      toast.error('Please upload at least one document')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('plotNumber', selectedPlotData.plotNumber)
      formData.append('surveyRecordNumber', selectedPlotData.surveyRecordNumber)
      documents.forEach(doc => formData.append('documents', doc))

      await submitFile(formData)
      toast.success('File submitted successfully')
      router.push('/surveyor/files')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Submit File">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Submit file to DSM
          </h2>

          {fetching ? (
            <p className="text-slate-500 text-sm">Loading your plot numbers...</p>
          ) : plots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-4">
                You have no plot numbers available to submit. All your plot numbers already have files submitted, or you haven&apos;t requested one yet.
              </p>
              <button
                onClick={() => router.push('/surveyor/request')}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Request a plot number
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Select plot number
                </label>
                <select
                  value={selectedPlot}
                  onChange={(e) => setSelectedPlot(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                >
                  {plots.map((plot) => (
                    <option key={plot._id} value={plot.plotNumber}>
                      {plot.plotNumber} — {plot.surveyRecordNumber}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlotData && (
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                  <p>Plot: <span className="font-mono text-slate-700">{selectedPlotData.plotNumber}</span></p>
                  <p>Survey Record: <span className="font-mono text-slate-700">{selectedPlotData.surveyRecordNumber}</span></p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Upload documents
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setDocuments(Array.from(e.target.files))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-slate-400 text-xs mt-1">
                  Allowed: PDF, DOC, DOCX, JPG, PNG. Max 10MB each.
                </p>
              </div>

              {documents.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Selected files ({documents.length}):
                  </p>
                  {documents.map((doc, i) => (
                    <p key={i} className="text-xs text-slate-600 flex items-center gap-2">
                      <FileText size={14} /> {doc.name}
                    </p>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit file to DSM'}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Badge from '@/components/ui/Badge'
import WorkflowTimeline from '@/components/workflow/WorkflowTimeline'
import DocumentViewer from '@/components/ui/DocumentViewer'
import { searchPlotNumber } from '@/lib/api'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setNotFound(false)
    try {
      const res = await searchPlotNumber(query.trim())
      setResult(res.data.data)
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true)
      } else {
        toast.error('Search failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Search by Plot Number">
      <div className="max-w-3xl mx-auto space-y-6">

        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter plot number e.g. PLT-2026-00001"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={18} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {notFound && (
          <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
            <p className="text-slate-500">No plot number found matching <strong className="font-mono">{query}</strong></p>
          </div>
        )}

        {result && (
          <div className="space-y-6">

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Plot details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Plot number</p>
                  <p className="font-bold text-indigo-700 font-mono">{result.plot.plotNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500">Survey record</p>
                  <p className="font-bold text-indigo-700 font-mono">{result.plot.surveyRecordNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500">Assigned to</p>
                  <p className="font-medium">{result.plot.surveyorId?.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Surveyor email</p>
                  <p>{result.plot.surveyorId?.email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Issued on</p>
                  <p>{new Date(result.plot.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">File submitted</p>
                  <p className={result.file ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {result.file ? 'Yes' : 'Not yet'}
                  </p>
                </div>
              </div>
            </div>

            {result.file && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-semibold text-slate-800 mb-4">File status</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-500">Current status</p>
                      <Badge status={result.file.status} />
                    </div>
                    <div>
                      <p className="text-slate-500">Current stage</p>
                      <Badge status={result.file.currentStage} />
                    </div>
                    <div>
                      <p className="text-slate-500">Submitted on</p>
                      <p>{new Date(result.file.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <WorkflowTimeline
                    stages={result.file.stages}
                    currentStage={result.file.currentStage}
                    overallStatus={result.file.status}
                  />
                </div>

                {result.file.documents?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Documents</h3>
                    <DocumentViewer documents={result.file.documents} />
                  </div>
                )}

                {result.auditLogs?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Complete history</h3>
                    <div className="space-y-3">
                      {result.auditLogs.map((log, i) => (
                        <div key={i} className="border-l-2 border-indigo-200 pl-3">
                          <p className="text-xs font-medium text-slate-800">{log.action}</p>
                          <p className="text-xs text-slate-500">{log.performedBy?.name} - {log.role}</p>
                          <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                          {log.remarks && <p className="text-xs text-slate-600 mt-1 italic">{log.remarks}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
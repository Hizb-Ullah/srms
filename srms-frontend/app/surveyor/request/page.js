'use client'

import { useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { requestPlot } from '@/lib/api'
import toast from 'react-hot-toast'
import { Hash, CheckCircle2 } from 'lucide-react'

export default function RequestNumberPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleRequest = async () => {
    setLoading(true)
    try {
      const res = await requestPlot()
      setResult(res.data.data)
      toast.success('Plot number issued successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request plot number')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Request Plot Number">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">

          <div className="flex justify-center mb-4">
            <div className="bg-indigo-50 text-indigo-700 p-4 rounded-full">
              <Hash size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Request plot number
          </h2>
          <p className="text-slate-500 mb-8">
            Click the button below to get a unique plot number and survey record number assigned to you.
          </p>

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} /> Numbers issued successfully
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Plot number</span>
                  <span className="font-bold text-indigo-700 font-mono text-sm">{result.plotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Survey record number</span>
                  <span className="font-bold text-indigo-700 font-mono text-sm">{result.surveyRecordNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Issued at</span>
                  <span className="text-slate-700">
                    {new Date(result.issuedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-emerald-700 text-sm mt-3">
                Please save these numbers. You will need them to submit your file.
              </p>
            </div>
          )}

          <button
            onClick={handleRequest}
            disabled={loading || result}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? 'Requesting...' : result ? 'Number issued' : 'Request plot number'}
          </button>

          {result && (
            <button
              onClick={() => setResult(null)}
              className="w-full mt-3 border border-slate-200 text-slate-600 py-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition"
            >
              Request another number
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
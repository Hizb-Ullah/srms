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
        <div className="bg-white rounded-xl shadow p-8 text-center">

          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 text-blue-900 p-4 rounded-full">
              <Hash size={36} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Request Plot Number
          </h2>
          <p className="text-gray-500 mb-8">
            Click the button below to get a unique plot number and survey record number assigned to you.
          </p>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} /> Numbers Issued Successfully
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plot Number</span>
                  <span className="font-bold text-blue-900">{result.plotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Survey Record Number</span>
                  <span className="font-bold text-blue-900">{result.surveyRecordNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issued At</span>
                  <span className="text-gray-700">
                    {new Date(result.issuedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-green-700 text-sm mt-3">
                Please save these numbers. You will need them to submit your file.
              </p>
            </div>
          )}

          <button
            onClick={handleRequest}
            disabled={loading || result}
            className="w-full bg-blue-900 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? 'Requesting...' : result ? 'Number Issued' : 'Request Plot Number'}
          </button>

          {result && (
            <button
              onClick={() => setResult(null)}
              className="w-full mt-3 border border-gray-300 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Request Another Number
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
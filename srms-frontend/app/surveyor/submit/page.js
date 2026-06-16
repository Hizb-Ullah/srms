'use client'

import { useState } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { submitFile } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FileText } from 'lucide-react'

export default function SubmitFilePage() {
  const [plotNumber, setPlotNumber] = useState('')
  const [surveyRecordNumber, setSurveyRecordNumber] = useState('')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (documents.length === 0) {
      toast.error('Please upload at least one document')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('plotNumber', plotNumber)
      formData.append('surveyRecordNumber', surveyRecordNumber)
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
        <div className="bg-white rounded-xl shadow p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Submit File to DSM
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Number
              </label>
              <input
                type="text"
                value={plotNumber}
                onChange={(e) => setPlotNumber(e.target.value)}
                required
                placeholder="e.g. PLT-2026-00001"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Record Number
              </label>
              <input
                type="text"
                value={surveyRecordNumber}
                onChange={(e) => setSurveyRecordNumber(e.target.value)}
                required
                placeholder="e.g. SRN-2026-00001"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Documents
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setDocuments(Array.from(e.target.files))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                Allowed: PDF, DOC, DOCX, JPG, PNG. Max 10MB each.
              </p>
            </div>

            {documents.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Files ({documents.length}):
                </p>
                {documents.map((doc, i) => (
                  <p key={i} className="text-xs text-gray-600 flex items-center gap-2">
                    <FileText size={14} /> {doc.name}
                  </p>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit File to DSM'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
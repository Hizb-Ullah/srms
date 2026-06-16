'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { getAuditLogs } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await getAuditLogs()
        setLogs(res.data.data)
      } catch (error) {
        toast.error('Failed to load audit logs')
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  return (
    <DashboardLayout title="Audit Logs">
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">
          Complete Action History
        </h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500">No audit logs yet.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 border-b pb-4">
                <div className="w-2 h-2 rounded-full bg-blue-900 mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{log.action}</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-xs text-gray-500">
                      By: {log.performedBy?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Role: {log.role}
                    </p>
                    {log.fileId && (
                      <p className="text-xs text-gray-500">
                        Plot: {log.fileId?.plotNumber}
                      </p>
                    )}
                  </div>
                  {log.remarks && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      {log.remarks}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
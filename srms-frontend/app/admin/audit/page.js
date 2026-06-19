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
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          Complete action history
        </h3>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-slate-50 pb-4 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-slate-200 mt-2 flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-slate-500">No audit logs yet.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 border-b border-slate-50 pb-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{log.action}</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-xs text-slate-500">By: {log.performedBy?.name}</p>
                    <p className="text-xs text-slate-500">Role: {log.role}</p>
                    {log.fileId && (
                      <p className="text-xs text-slate-500 font-mono">{log.fileId?.plotNumber}</p>
                    )}
                  </div>
                  {log.remarks && (
                    <p className="text-xs text-slate-600 mt-1 italic">{log.remarks}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
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
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { getStorageFiles } from '@/lib/api'
import toast from 'react-hot-toast'
import { FolderOpen } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

// Storage office — read-only view of files RMU has dispatched here after the
// surveyor collects. Storage scans and stores them online, then files the
// hard copies safely.
export default function StoragePage() {
  const [records, setRecords] = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getStorageFiles()
      .then(res => setRecords(res.data.data))
      .catch(() => toast.error('Failed to load storage files'))
      .finally(() => setFetching(false))
  }, [])

  return (
    <DashboardLayout title="Storage">
      <div className="space-y-6">
        <div className="rounded-xl p-5 flex items-center gap-4 bg-slate-100 text-slate-700 w-fit">
          <FolderOpen size={24} />
          <div>
            <p className="text-xs font-medium opacity-75">Files in Storage</p>
            <p className="text-3xl font-bold">{fetching ? '—' : records.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Files in Storage</h3>
          {fetching ? (
            <TableSkeleton rows={3} />
          ) : records.length === 0 ? (
            <p className="text-slate-500 text-sm">No files in storage yet.</p>
          ) : (
            <div className="space-y-3">
              {records.map(r => (
                <div key={r._id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-sm text-slate-800">{r.village}</span>
                    <span className="text-xs text-slate-400">{r.requestedBy?.name || '—'}</span>
                    <span className="text-xs text-slate-500">
                      SR#: <span className="font-mono">{r.plots?.map(p => p.surveyRecordNumber).join(', ') || '—'}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Sent to storage {r.rmuStorageAt ? new Date(r.rmuStorageAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

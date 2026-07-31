'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import { getAccountsQueue, getAccountsCompleted, acceptAccountsPayment } from '@/lib/api'
import toast from 'react-hot-toast'
import { Wallet, CheckCircle, Inbox } from 'lucide-react'
import { TableSkeleton } from '@/components/ui/Skeleton'

// Per client's Accounts schema: Add Payment -> SR# -> Receipt# -> Add/Accept.
// A request lands here once the Lot Allocator gives final authorisation;
// Accounts logs their own official receipt number against its SR#(s) and
// accepts it. Bookkeeping only — no effect on the lot-allocation/RMU/
// Controller pipeline.
export default function AccountsPage() {
  const [queue, setQueue] = useState([])
  const [completed, setCompleted] = useState([])
  const [tab, setTab] = useState('queue')
  const [fetching, setFetching] = useState(true)
  const [openFor, setOpenFor] = useState(null)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const inputRef = useRef()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setFetching(true)
    try {
      const [qRes, cRes] = await Promise.all([getAccountsQueue(), getAccountsCompleted()])
      setQueue(qRes.data.data)
      setCompleted(cRes.data.data)
    } catch {
      toast.error('Failed to load Accounts records')
    } finally {
      setFetching(false)
    }
  }

  const srNumbers = (record) => record.plots.map(p => p.surveyRecordNumber).join(', ') || '—'

  const handleAccept = async (id) => {
    if (!receiptNumber.trim()) return toast.error('Receipt # is required')
    setActionLoading(id)
    try {
      await acceptAccountsPayment(id, { receiptNumber: receiptNumber.trim() })
      toast.success('Payment logged and accepted')
      setOpenFor(null)
      setReceiptNumber('')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const list = tab === 'queue' ? queue : completed

  return (
    <DashboardLayout title="Accounts">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTab('queue')}
            className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
              tab === 'queue' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-amber-50 text-amber-700'
            }`}
          >
            <Inbox size={24} />
            <div>
              <p className="text-xs font-medium opacity-75">Add Payment</p>
              <p className="text-3xl font-bold">{fetching ? '—' : queue.length}</p>
            </div>
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`rounded-xl p-5 flex items-center gap-4 text-left border-2 transition ${
              tab === 'completed' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-emerald-50 text-emerald-700'
            }`}
          >
            <CheckCircle size={24} />
            <div>
              <p className="text-xs font-medium opacity-75">Accepted</p>
              <p className="text-3xl font-bold">{fetching ? '—' : completed.length}</p>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            {tab === 'queue' ? 'Authorised Requests — Awaiting Accounts' : 'Accepted by Accounts'}
          </h3>
          {fetching ? (
            <TableSkeleton rows={3} />
          ) : list.length === 0 ? (
            <p className="text-slate-500 text-sm">No records here.</p>
          ) : (
            <div className="space-y-3">
              {list.map(r => (
                <div key={r._id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-sm text-slate-800">{r.village}</span>
                      <span className="text-xs text-slate-400">{r.requestedBy?.name || '—'}</span>
                      <span className="text-xs text-slate-500">SR#: <span className="font-mono">{srNumbers(r)}</span></span>
                    </div>
                    {tab === 'completed' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Receipt: {r.accountsReceiptNumber}
                      </span>
                    )}
                  </div>

                  {tab === 'queue' && (
                    openFor === r._id ? (
                      <div className="flex flex-wrap gap-2 items-center mt-3">
                        <input
                          ref={inputRef}
                          value={receiptNumber}
                          onChange={(e) => setReceiptNumber(e.target.value)}
                          placeholder="Enter Receipt #"
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleAccept(r._id)}
                          disabled={actionLoading === r._id}
                          className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          <CheckCircle size={14} /> Add / Accept
                        </button>
                        <button
                          onClick={() => { setOpenFor(null); setReceiptNumber('') }}
                          className="border border-slate-200 text-slate-500 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setOpenFor(r._id); setReceiptNumber('') }}
                        className="flex items-center gap-1.5 border border-indigo-300 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-50 transition mt-3"
                      >
                        <Wallet size={14} /> Add Payment
                      </button>
                    )
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

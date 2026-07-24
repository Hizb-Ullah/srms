'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/app/dashboard-layout'
import Modal from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getAllUsers, createUser, updateUser, deleteUser, toggleUserLock, resetUserPassword } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, KeyRound, Copy } from 'lucide-react'

const GROUP = 'DSM'
const SUB_ROLES = [
  'Director',
  'Files Controller',
  'Lot Allocator',
  'File Registration and Reservation',
  'File Capturing',
  'File Examination',
  'File Approval'
]
const cls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function DsmUsersPage() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen]     = useState(false)
  const [resetOpen, setResetOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected]     = useState(null)
  const [form, setForm]             = useState({ name: '', email: '', subRole: SUB_ROLES[0] })
  const [generatedPw, setGeneratedPw] = useState('')
  const [newPw, setNewPw]           = useState('')
  const [saving, setSaving]         = useState(false)

  const loadUsers = async () => {
    try {
      const res = await getAllUsers()
      setUsers(res.data.data.filter(u => u.group === GROUP))
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [])

  const openCreate = () => {
    const pw = generatePassword()
    setGeneratedPw(pw)
    setForm({ name: '', email: '', subRole: SUB_ROLES[0] })
    setCreateOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await createUser({ name: form.name, email: form.email, password: generatedPw, role: 'officer', group: GROUP, subRole: form.subRole })
      toast.success(`User created — password: ${generatedPw}`)
      setCreateOpen(false); loadUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await updateUser(selected._id, { name: form.name, email: form.email, role: selected.role || 'officer', group: GROUP, subRole: form.subRole })
      toast.success('User updated'); setEditOpen(false); loadUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const pw = newPw || generatePassword()
      const res = await resetUserPassword(selected._id, { newPassword: pw })
      toast.success(`${res.data.message} — new password: ${pw}`)
      setResetOpen(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteUser(selected._id); toast.success('Deleted'); setDeleteOpen(false); loadUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleLock = async (id) => {
    try { const r = await toggleUserLock(id); toast.success(r.data.message); loadUsers() }
    catch { toast.error('Failed') }
  }

  return (
    <DashboardLayout title="DSM Employees">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">DSM Employees</h3>
            <p className="text-xs text-slate-400 mt-0.5">Director · Files Controller · Lot Allocator · File Registration &amp; Reservation · File Capturing · File Examination · File Approval</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition">
            <Plus size={16} /> Add DSM Employee
          </button>
        </div>

        {loading ? <TableSkeleton rows={4} /> : users.length === 0 ? (
          <p className="text-slate-500 text-sm">No DSM users yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-3">Name</th><th className="pb-3">Email</th>
                <th className="pb-3">Sub-Role</th><th className="pb-3">Status</th>
                <th className="pb-3">Last login</th><th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td className="py-3 text-slate-500">{u.email}</td>
                  <td className="py-3">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">{u.subRole || '—'}</span>
                  </td>
                  <td className="py-3">
                    <span className={u.isLocked ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
                      {u.isLocked ? 'Locked' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setSelected(u); setForm({ name: u.name, email: u.email, password: '', subRole: u.subRole || SUB_ROLES[0] }); setEditOpen(true) }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition"><Pencil size={15} /></button>
                      <button onClick={() => { setSelected(u); setResetPw(''); setShowPw(false); setResetOpen(true) }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition"><KeyRound size={15} /></button>
                      <button onClick={() => handleLock(u._id)}
                        className={u.isLocked ? 'bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-emerald-100 transition' : 'bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-rose-100 transition'}>
                        {u.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                      <button onClick={() => { setSelected(u); setDeleteOpen(true) }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add DSM Employee">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Full name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={cls} /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={cls} /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Sub-Role</label>
            <select value={form.subRole} onChange={e => setForm({...form, subRole: e.target.value})} className={cls}>
              {SUB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select></div>
          <div className="bg-slate-50 rounded-lg px-3 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Auto-generated password</p>
              <p className="font-mono text-sm font-bold text-indigo-700">{generatedPw}</p>
            </div>
            <button type="button" onClick={() => { navigator.clipboard.writeText(generatedPw); toast.success('Copied') }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 transition"><Copy size={15} /></button>
          </div>
          <p className="text-xs text-slate-400">Share this password with the user. They can change it after first login.</p>
          <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50">
            {saving ? 'Creating...' : 'Create user'}</button>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit DSM user">
        <form onSubmit={handleEdit} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Full name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={cls} /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={cls} /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Sub-Role</label>
            <select value={form.subRole} onChange={e => setForm({...form, subRole: e.target.value})} className={cls}>
              {SUB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select></div>
          <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset password — ${selected?.name || ''}`}>
        <form onSubmit={handleReset} className="space-y-4">
          <p className="text-xs text-slate-500">Leave blank to auto-generate a new password, or enter a custom one.</p>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">New password (optional)</label>
            <input type="text" minLength={8} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Leave blank to auto-generate" className={cls} /></div>
          <button type="submit" disabled={saving} className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 active:scale-[0.98] transition disabled:opacity-50">
            {saving ? 'Resetting...' : 'Reset password'}</button>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete user">
        <p className="text-sm text-slate-600 mb-5">Delete <strong>{selected?.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteOpen(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-700 active:scale-[0.98] transition disabled:opacity-50">
            {saving ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

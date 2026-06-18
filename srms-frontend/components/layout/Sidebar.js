'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Home, Hash, FolderOpen, ClipboardList,
  CheckCircle, Users, FileBarChart, LogOut
} from 'lucide-react'

const menuItems = {
  surveyor: [
    { label: 'Dashboard',       path: '/surveyor',         icon: Home },
    { label: 'Request Number',  path: '/surveyor/request', icon: Hash },
    { label: 'Submit File',     path: '/surveyor/submit',  icon: FolderOpen },
    { label: 'My Files',        path: '/surveyor/files',   icon: ClipboardList },
  ],
  officer: [
    { label: 'Dashboard',       path: '/officer',          icon: Home },
    { label: 'File Queue',      path: '/officer/queue',    icon: ClipboardList },
  ],
  approver: [
    { label: 'Dashboard',       path: '/approver',         icon: Home },
    { label: 'Pending Approval',path: '/approver/queue',   icon: CheckCircle },
  ],
  admin: [
    { label: 'Dashboard',       path: '/admin',            icon: Home },
    { label: 'Users',           path: '/admin/users',      icon: Users },
    { label: 'All Files',       path: '/admin/files',      icon: FolderOpen },
    { label: 'Audit Logs',      path: '/admin/audit',      icon: FileBarChart },
  ]
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  if (!user) return null

  const items = menuItems[user.role] || []

  return (
    <div className="w-64 min-h-screen bg-gradient-to-b from-indigo-950 to-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">SRMS</h1>
        <p className="text-indigo-300 text-xs mt-1">Survey Record Management</p>
      </div>

      <div className="p-4 border-b border-white/10">
        <p className="font-semibold text-sm">{user.name}</p>
        <p className="text-indigo-300 text-xs capitalize">{user.role}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center gap-3 transition active:scale-[0.98]
                ${active
                  ? 'bg-white text-indigo-950 font-semibold shadow-sm'
                  : 'text-indigo-100 hover:bg-white/10 hover:translate-x-0.5'
                }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-rose-300 hover:bg-white/10 transition flex items-center gap-3 active:scale-[0.98]"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  )
}
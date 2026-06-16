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
    <div className="w-64 min-h-screen bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-xl font-bold">SRMS</h1>
        <p className="text-blue-300 text-xs mt-1">Survey Record Management</p>
      </div>

      <div className="p-4 border-b border-blue-800">
        <p className="font-semibold text-sm">{user.name}</p>
        <p className="text-blue-300 text-xs capitalize">{user.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition
                ${pathname === item.path
                  ? 'bg-white text-blue-900 font-semibold'
                  : 'hover:bg-blue-800 text-white'
                }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-300 hover:bg-blue-800 transition flex items-center gap-3"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  )
}
'use client'

import { useAuth } from '@/context/AuthContext'
import Badge from '@/components/ui/Badge'
import TopBar from '@/components/layout/TopBar'
import NotificationBell from '@/components/layout/NotificationBell'

export default function Navbar({ title }) {
  const { user } = useAuth()

  return (
    <div>
      <TopBar title={title} />
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-end gap-3">
        <NotificationBell />
        <div className="w-px h-5 bg-slate-200"></div>
        <Badge status={user?.role} />
        <span className="text-sm text-slate-600 font-medium">{user?.name}</span>
      </div>
    </div>
  )
}
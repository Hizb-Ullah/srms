'use client'

import { useAuth } from '@/context/AuthContext'
import Badge from '@/components/ui/Badge'

export default function Navbar({ title }) {
  const { user } = useAuth()

  return (
    <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-3">
        <Badge status={user?.role} />
        <span className="text-sm text-gray-600">{user?.name}</span>
      </div>
    </div>
  )
}
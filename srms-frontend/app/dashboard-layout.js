'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'

const roleBg = {
  surveyor: 'bg-sky-50',
  officer:  'bg-violet-50',
  approver: 'bg-amber-50',
  admin:    'bg-rose-50'
}

export default function DashboardLayout({ children, title }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  const bg = roleBg[user.role] || 'bg-slate-50'

  return (
    <div className={`flex min-h-screen ${bg}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar title={title} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
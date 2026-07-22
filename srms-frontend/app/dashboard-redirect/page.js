'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function DashboardRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.group === 'Private' || user.group === 'LandBoard') router.push('/surveyor/lot-requests')
        else if (user.group === 'DSM') router.push('/lot-allocator')
        else router.push(`/${user.role}`)
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )
}

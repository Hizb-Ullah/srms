'use client'

import DashboardLayout from '@/app/dashboard-layout'
import FileSectionBoard from '@/components/workflow/FileSectionBoard'

export default function RegistrationPage() {
  return (
    <DashboardLayout title="File Registration & Reservation">
      <FileSectionBoard
        section="registration"
        title="Registration & Reservation"
        actionLabel="Release & Register"
        hasOutcome={false}
      />
    </DashboardLayout>
  )
}

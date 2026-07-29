'use client'

import DashboardLayout from '@/app/dashboard-layout'
import FileSectionBoard from '@/components/workflow/FileSectionBoard'

export default function CapturingPage() {
  return (
    <DashboardLayout title="File Capturing">
      <FileSectionBoard
        section="capturing"
        title="Capturing"
        actionLabel="Capture File"
        hasOutcome={false}
      />
    </DashboardLayout>
  )
}

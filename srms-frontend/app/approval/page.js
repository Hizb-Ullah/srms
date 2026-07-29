'use client'

import DashboardLayout from '@/app/dashboard-layout'
import FileSectionBoard from '@/components/workflow/FileSectionBoard'

export default function ApprovalPage() {
  return (
    <DashboardLayout title="File Approval">
      <FileSectionBoard
        section="approval"
        title="Approval"
        hasOutcome={true}
      />
    </DashboardLayout>
  )
}

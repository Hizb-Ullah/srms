'use client'

import DashboardLayout from '@/app/dashboard-layout'
import FileSectionBoard from '@/components/workflow/FileSectionBoard'

export default function ExaminationPage() {
  return (
    <DashboardLayout title="File Examination">
      <FileSectionBoard
        section="examination"
        title="Examination"
        hasOutcome={true}
      />
    </DashboardLayout>
  )
}

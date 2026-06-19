import { Check, Clock, X } from 'lucide-react'

const STAGE_LABELS = {
  submitted: 'Submitted',
  capturing: 'Capturing',
  examination: 'Examination',
  approval: 'Approval',
  dispatch: 'Dispatch',
  archived: 'Archived'
}

export default function WorkflowTimeline({ stages, currentStage, overallStatus }) {
  const orderedStages = [
    { name: 'submitted', status: 'passed' },
    ...stages
  ]

  return (
    <div className="relative">
      {orderedStages.map((stage, i) => {
        const isLast = i === orderedStages.length - 1
        const isFailed = stage.status === 'failed'
        const isPassed = stage.status === 'passed'
        const isPending = stage.status === 'pending'
        const isCurrent = stage.name === currentStage

        const dotColor = isFailed
          ? 'bg-rose-500'
          : isPassed
          ? 'bg-emerald-500'
          : isCurrent
          ? 'bg-indigo-500'
          : 'bg-slate-200'

        const lineColor = isPassed ? 'bg-emerald-300' : 'bg-slate-200'

        return (
          <div key={stage.name} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${dotColor} ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}>
                {isFailed ? (
                  <X size={14} className="text-white" />
                ) : isPassed ? (
                  <Check size={14} className="text-white" />
                ) : isCurrent ? (
                  <Clock size={14} className="text-white" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                )}
              </div>
              {!isLast && <div className={`w-0.5 flex-1 min-h-[28px] ${lineColor}`}></div>}
            </div>

            <div className="pb-7">
              <p className={`text-sm font-medium capitalize ${isCurrent ? 'text-indigo-700' : 'text-slate-700'}`}>
                {STAGE_LABELS[stage.name] || stage.name}
              </p>
              {stage.timestamp && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(stage.timestamp).toLocaleString()}
                </p>
              )}
              {stage.remarks && (
                <p className={`text-xs mt-1 rounded-lg px-2 py-1 inline-block ${isFailed ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                  {stage.remarks}
                </p>
              )}
              {isCurrent && overallStatus !== 'rework' && (
                <p className="text-xs text-indigo-500 mt-1 font-medium">In progress</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
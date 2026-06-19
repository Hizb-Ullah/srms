export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-3 bg-slate-100 rounded w-28"></div>
          <div className="h-3 bg-slate-100 rounded w-24"></div>
          <div className="h-3 bg-slate-100 rounded w-20"></div>
          <div className="h-5 bg-slate-100 rounded-full w-20"></div>
          <div className="h-3 bg-slate-100 rounded w-16"></div>
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
      <div className="h-3 bg-slate-100 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
    </div>
  )
}
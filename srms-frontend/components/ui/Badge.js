export default function Badge({ status }) {
  const styles = {
    submitted:   'bg-sky-100 text-sky-700',
    capturing:   'bg-amber-100 text-amber-700',
    examination: 'bg-violet-100 text-violet-700',
    approval:    'bg-orange-100 text-orange-700',
    dispatch:    'bg-emerald-100 text-emerald-700',
    archived:    'bg-slate-100 text-slate-600',
    rework:      'bg-rose-100 text-rose-700',
    rejected:    'bg-red-200 text-red-800',
    appealed:    'bg-orange-100 text-orange-700',
    pending:     'bg-slate-100 text-slate-500',
    passed:      'bg-emerald-100 text-emerald-700',
    failed:      'bg-rose-100 text-rose-700',
    surveyor:    'bg-sky-100 text-sky-700',
    officer:     'bg-violet-100 text-violet-700',
    approver:    'bg-orange-100 text-orange-700',
    admin:       'bg-rose-100 text-rose-700',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}
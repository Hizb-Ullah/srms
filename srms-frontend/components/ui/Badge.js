export default function Badge({ status }) {
  const styles = {
    submitted:   'bg-blue-100 text-blue-800',
    capturing:   'bg-yellow-100 text-yellow-800',
    examination: 'bg-purple-100 text-purple-800',
    approval:    'bg-orange-100 text-orange-800',
    dispatch:    'bg-green-100 text-green-800',
    archived:    'bg-gray-100 text-gray-800',
    rework:      'bg-red-100 text-red-800',
    pending:     'bg-gray-100 text-gray-600',
    passed:      'bg-green-100 text-green-800',
    failed:      'bg-red-100 text-red-800',
    surveyor:    'bg-blue-100 text-blue-800',
    officer:     'bg-purple-100 text-purple-800',
    approver:    'bg-orange-100 text-orange-800',
    admin:       'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}
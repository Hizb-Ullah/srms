import AnimatedCounter from './AnimatedCounter'

export default function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-slate-800">
          <AnimatedCounter value={value || 0} />
        </p>
      </div>
    </div>
  )
}
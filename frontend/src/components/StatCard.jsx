export default function StatCard({ title, value, subtitle, color }) {
  const colors = {
    violet: 'bg-violet-50 border-violet-200 text-violet-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
  }

  return (
    <div className={`rounded-xl border p-5 ${colors[color] || colors.violet}`}>
      <p className="text-sm font-medium opacity-70">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
    </div>
  )
}
export default function StatCard({ num, label, color }) {
  return (
    <div className="card text-center">
      <div className={`text-4xl font-extrabold leading-none ${color}`}>{num ?? '—'}</div>
      <div className="text-xs text-brand-purple/60 mt-1.5 uppercase tracking-wider">{label}</div>
    </div>
  )
}

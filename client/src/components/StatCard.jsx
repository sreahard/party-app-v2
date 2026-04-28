export default function StatCard({ num, label, color }) {
  return (
    <div className="card text-center">
      <div className={`text-5xl font-bold leading-none ${color}`}>{num ?? '—'}</div>
      <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-brand-ink">{label}</div>
    </div>
  )
}

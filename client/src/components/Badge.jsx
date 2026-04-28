const CONFIG = {
  yes: { label: 'Coming', cls: 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80' },
  no: { label: "Can't come", cls: 'bg-red-50 text-red-900 ring-1 ring-red-200/70' },
  maybe: { label: 'Maybe', cls: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80' },
  pending: { label: 'Pending', cls: 'bg-brand-mist text-brand-ink ring-1 ring-brand-sea-mist' },
}

export default function Badge({ status }) {
  const { label, cls } = CONFIG[status] ?? CONFIG.pending
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

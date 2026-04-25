const CONFIG = {
  yes:     { label: '✓ Coming',     cls: 'bg-green-100 text-green-800' },
  no:      { label: '✗ Can\'t Come', cls: 'bg-red-100 text-red-800' },
  maybe:   { label: '? Maybe',      cls: 'bg-yellow-100 text-yellow-800' },
  pending: { label: '⏳ Pending',   cls: 'bg-gray-100 text-gray-600' },
}

export default function Badge({ status }) {
  const { label, cls } = CONFIG[status] ?? CONFIG.pending
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

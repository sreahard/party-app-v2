import { useEffect, useRef, useState } from 'react'
import { api } from '../../api'
import Badge from '../../components/Badge'
import { EditGuestModal, DeleteGuestModal } from '../../components/GuestModal'
import { useToast } from '../../context/ToastContext'

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'yes',     label: '✓ Coming' },
  { key: 'no',      label: '✗ Not Coming' },
  { key: 'maybe',   label: '? Maybe' },
  { key: 'pending', label: '⏳ Pending' },
]

export default function GuestsPage() {
  const toast             = useToast()
  const [guests,  setGuests]  = useState([])
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting,setDeleting]= useState(null)
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const phoneRef = useRef(null)

  const load = () => api.guests.list().then(setGuests)
  useEffect(() => { load() }, [])

  const visible = guests.filter(g => {
    if (filter !== 'all' && g.rsvp_status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return g.name.toLowerCase().includes(q) || g.phone.includes(q)
    }
    return true
  })

  async function addGuest() {
    if (!name.trim() || !phone.trim()) return toast('Name and phone are required', 'error')
    const res = await api.guests.add({ name: name.trim(), phone: phone.trim() })
    if (res.error) return toast(res.error, 'error')
    setGuests(prev => [...prev, res])
    setName(''); setPhone('')
    toast(`${res.name} added! 🎉`, 'success')
  }

  async function saveEdit(form) {
    const res = await api.guests.update(editing.id, form)
    if (res.error) return toast(res.error, 'error')
    setGuests(prev => prev.map(g => g.id === res.id ? res : g))
    setEditing(null)
    toast('Guest updated!', 'success')
  }

  async function confirmDelete() {
    await api.guests.remove(deleting.id)
    setGuests(prev => prev.filter(g => g.id !== deleting.id))
    setDeleting(null)
    toast('Guest removed', 'info')
  }

  function importCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ({ target }) => {
      const lines = target.result.split('\n').filter(l => l.trim())
      const parsed = []
      for (const line of lines) {
        const [a, b] = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
        if (a?.toLowerCase() === 'name' || a?.toLowerCase() === 'full name') continue
        if (a && b) parsed.push({ name: a, phone: b })
      }
      if (!parsed.length) return toast('No valid rows found. Use Name, Phone columns.', 'error')
      const res = await api.guests.importBulk(parsed)
      if (res.error) return toast(res.error, 'error')
      await load()
      toast(`Imported ${res.added} guests (${res.skipped} skipped)`, 'success')
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Add guest */}
        <div className="card">
          <h2 className="section-title">➕ Add Guest</h2>
          <div className="flex gap-3 flex-wrap">
            <input className="field flex-1 min-w-36"
                   placeholder="Full name"
                   value={name} onChange={e => setName(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && phoneRef.current?.focus()} />
            <input className="field flex-1 min-w-36" type="tel"
                   placeholder="Phone number"
                   ref={phoneRef}
                   value={phone} onChange={e => setPhone(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addGuest()} />
            <button className="btn-primary" onClick={addGuest}>+ Add</button>
          </div>
        </div>

        {/* CSV import */}
        <div className="card">
          <h2 className="section-title">📁 Import from CSV</h2>
          <label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl border-2 border-dashed
                            border-brand-sea-mist/90 p-8 text-base text-brand-muted transition
                            hover:border-brand-sea hover:bg-brand-mist/50">
            <span className="text-3xl">📋</span>
            <span>Click to upload a CSV — columns: <strong>Name, Phone</strong></span>
            <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
          </label>
        </div>

        {/* Guest table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="section-title mb-0">
              👥 All Guests
              <span className="ml-2 text-sm font-normal normal-case text-brand-muted">
                ({visible.length} shown / {guests.length} total)
              </span>
            </h2>
            <button className="btn-secondary text-xs" onClick={load}>↺ Refresh</button>
          </div>

          {/* Filters + search */}
          <div className="flex gap-2 flex-wrap mb-4">
            <input className="field flex-1 min-w-44 text-sm"
                   placeholder="🔍 Search by name or phone…"
                   value={search} onChange={e => setSearch(e.target.value)} />
            {FILTERS.map(f => (
              <button key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition
                                  ${filter === f.key
                                    ? 'border-brand-coral bg-brand-coral text-white'
                                    : 'border-brand-sea-mist bg-white text-brand-subtle hover:border-brand-sea hover:text-brand-ink'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {visible.length === 0 ? (
            <div className="py-10 text-center text-base text-brand-muted">
              <div className="text-3xl mb-2">🔍</div>No guests match your filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brand-sea-mist/70">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-brand-mist/90 text-sm font-bold uppercase tracking-wide text-brand-ink">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">RSVP</th>
                    <th className="px-4 py-3 text-left">+1s</th>
                    <th className="px-4 py-3 text-left">Note</th>
                    <th className="px-4 py-3 text-left">Invited</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-sea-mist/50">
                  {visible.map(g => (
                    <tr key={g.id} className="transition-colors hover:bg-brand-mist/40">
                      <td className="px-4 py-3 text-base font-semibold text-brand-ink">{g.name}</td>
                      <td className="px-4 py-3 font-mono text-sm text-brand-subtle">{g.phone}</td>
                      <td className="px-4 py-3"><Badge status={g.rsvp_status} /></td>
                      <td className="px-4 py-3 text-brand-muted">{g.plus_ones > 0 ? `+${g.plus_ones}` : '—'}</td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-sm text-brand-subtle">{g.note || '—'}</td>
                      <td className="px-4 py-3">
                        {g.invited_at
                          ? <span className="text-sm font-bold text-emerald-900">● Sent</span>
                          : <span className="text-sm font-medium text-brand-muted">Not yet</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="btn-secondary text-xs py-1 px-2.5"
                                  onClick={() => setEditing(g)}>✏️ Edit</button>
                          <button className="btn-danger text-xs py-1 px-2.5"
                                  onClick={() => setDeleting(g)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <EditGuestModal   guest={editing}  onSave={saveEdit}     onClose={() => setEditing(null)} />
      <DeleteGuestModal guest={deleting} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
    </>
  )
}

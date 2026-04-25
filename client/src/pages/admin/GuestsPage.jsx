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
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed
                            border-brand-pink-light rounded-xl p-8 cursor-pointer text-gray-400 text-sm
                            hover:border-brand-pink hover:bg-brand-pink-light/30 transition">
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
              <span className="ml-2 text-gray-400 font-normal normal-case text-xs">
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
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition
                                  ${filter === f.key
                                    ? 'bg-brand-pink text-white border-brand-pink'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand-pink hover:text-brand-pink'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {visible.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              <div className="text-3xl mb-2">🔍</div>No guests match your filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brand-pink-light">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-pink-light text-brand-purple text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">RSVP</th>
                    <th className="px-4 py-3 text-left">+1s</th>
                    <th className="px-4 py-3 text-left">Note</th>
                    <th className="px-4 py-3 text-left">Invited</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-pink-light">
                  {visible.map(g => (
                    <tr key={g.id} className="hover:bg-pink-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{g.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{g.phone}</td>
                      <td className="px-4 py-3"><Badge status={g.rsvp_status} /></td>
                      <td className="px-4 py-3 text-gray-400">{g.plus_ones > 0 ? `+${g.plus_ones}` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[140px] truncate">{g.note || '—'}</td>
                      <td className="px-4 py-3">
                        {g.invited_at
                          ? <span className="text-xs text-green-600 font-medium">● Sent</span>
                          : <span className="text-xs text-gray-400">Not yet</span>}
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

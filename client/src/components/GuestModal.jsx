import { useState, useEffect } from 'react'

// ── Edit Modal ─────────────────────────────────────────────────────────────────
export function EditGuestModal({ guest, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', phone: '', rsvp_status: 'pending', plus_ones: 0, note: '',
  })

  useEffect(() => {
    if (guest) setForm({ name: guest.name, phone: guest.phone,
      rsvp_status: guest.rsvp_status, plus_ones: guest.plus_ones, note: guest.note ?? '' })
  }, [guest])

  if (!guest) return null

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Overlay onClose={onClose}>
      <h3 className="mb-5 text-xl font-bold text-brand-ink">Edit guest</h3>
      <div className="space-y-4">
        <Field label="Name">
          <input className="field" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Phone">
          <input className="field" type="tel" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="RSVP Status">
          <select className="field" value={form.rsvp_status} onChange={set('rsvp_status')}>
            <option value="pending">⏳ Pending</option>
            <option value="yes">✓ Coming</option>
            <option value="no">✗ Not Coming</option>
            <option value="maybe">? Maybe</option>
          </select>
        </Field>
        <Field label="Additional guests (+1s)">
          <input className="field" type="number" min="0" max="20"
                 value={form.plus_ones} onChange={set('plus_ones')} />
        </Field>
        <Field label="Note">
          <input className="field" placeholder="Any note…" value={form.note} onChange={set('note')} />
        </Field>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave(form)}>Save Changes</button>
      </div>
    </Overlay>
  )
}

// ── Delete Modal ───────────────────────────────────────────────────────────────
export function DeleteGuestModal({ guest, onConfirm, onClose }) {
  if (!guest) return null
  return (
    <Overlay onClose={onClose}>
      <h3 className="mb-3 text-xl font-bold text-brand-ink">Remove guest</h3>
      <p className="mb-6 text-base text-brand-subtle">
        Remove <strong className="text-brand-ink">{guest.name}</strong> from the guest list?
      </p>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>Remove</button>
      </div>
    </Overlay>
  )
}

// ── Shared ─────────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ocean/35 p-5 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-slide-up rounded-2xl border border-brand-sea-mist/60 bg-brand-shell p-7 shadow-2xl shadow-brand-ocean/10">
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

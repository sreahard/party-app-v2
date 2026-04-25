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
      <h3 className="text-base font-semibold mb-5">✏️ Edit Guest</h3>
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
      <h3 className="text-base font-semibold mb-3">🗑️ Remove Guest</h3>
      <p className="text-sm text-gray-500 mb-6">
        Remove <strong className="text-gray-800">{guest.name}</strong> from the guest list?
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl animate-slide-up">
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

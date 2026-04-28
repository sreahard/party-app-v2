import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useToast } from '../../context/ToastContext'

export default function InvitePage() {
  const toast       = useToast()
  const [message,   setMessage]   = useState('')
  const [target,    setTarget]    = useState('uninvited')
  const [guests,    setGuests]    = useState([])
  const [sending,   setSending]   = useState(false)
  const [results,   setResults]   = useState(null)

  useEffect(() => {
    api.settings.getAll().then(s => {
      if (s.invite_message) setMessage(s.invite_message)
    })
    api.guests.list().then(setGuests)
  }, [])

  const uninvitedCount = guests.filter(g => !g.invited_at).length
  const sendCount      = target === 'uninvited' ? uninvitedCount : guests.length

  // Preview: replace {name} with first guest's first name
  const previewName = guests[0]?.name.split(' ')[0] ?? 'Jamie'
  const preview     = message.replace(/{name}/gi, previewName)

  // SMS segment count
  const segments = message.length <= 160 ? 1 : Math.ceil(message.length / 153)

  async function saveMessage() {
    await api.settings.set('invite_message', message)
    toast('Message saved!', 'success')
  }

  async function send() {
    if (!message.trim()) return toast('Write an invite message first', 'error')
    setSending(true)
    setResults(null)
    const guest_ids = target === 'all' ? guests.map(g => g.id) : null
    const res = await api.invites.send({ guest_ids, message_template: message })
    setSending(false)
    if (res.error) return toast(res.error, 'error')
    setResults(res)
    const sent = res.sent?.length ?? 0
    toast(`${sent} text${sent !== 1 ? 's' : ''} sent! 🎉`, 'success')
    api.guests.list().then(setGuests)
  }

  return (
    <div className="space-y-6">
      {/* Message editor */}
      <div className="card">
        <h2 className="section-title">📨 Invite Message</h2>
        <label className="block mb-3">
          <span className="field-label">
            Message Text <span className="normal-case font-normal">(use {'{name}'} for the guest's first name)</span>
          </span>
          <textarea className="field" rows={5} value={message} onChange={e => setMessage(e.target.value)} />
          <span className="mt-1 block text-right text-sm text-brand-muted">
            {message.length} chars · {segments} SMS segment{segments > 1 ? 's' : ''}
          </span>
        </label>

        {/* Live preview */}
        <div className="min-h-[52px] whitespace-pre-wrap rounded-xl border border-brand-sea-mist/80 bg-brand-mist/60 p-4 text-base leading-relaxed text-brand-ocean">
          {preview || <span className="text-brand-muted">Preview will appear here…</span>}
        </div>

        <button className="btn-secondary mt-4" onClick={saveMessage}>💾 Save Message</button>
      </div>

      {/* Send section */}
      <div className="card">
        <h2 className="section-title">📤 Send Invites</h2>

        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {[
            { value: 'uninvited', title: '📬 Only uninvited guests',
              desc: `Send to ${uninvitedCount} guest${uninvitedCount !== 1 ? 's' : ''} who haven't received an invite yet` },
            { value: 'all',       title: '📣 Everyone (resend)',
              desc: `Send to all ${guests.length} guests, including those already invited` },
          ].map(opt => (
            <label key={opt.value}
                   className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition
                               ${target === opt.value
                                 ? 'border-brand-coral bg-brand-coral-wash/50'
                                 : 'border-brand-sea-mist hover:border-brand-sea'}`}>
              <input type="radio" name="target" value={opt.value}
                     checked={target === opt.value}
                     onChange={() => setTarget(opt.value)}
                     className="mt-0.5 accent-brand-coral" />
              <div>
                <div className="text-base font-bold text-brand-ink">{opt.title}</div>
                <div className="mt-0.5 text-sm text-brand-subtle">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <p className="mb-4 text-base text-brand-subtle">
          {sendCount === 0
            ? '⚠️ No guests to send to — add some guests first!'
            : `Will send to ${sendCount} guest${sendCount !== 1 ? 's' : ''}.`}
        </p>

        <button className="btn-success text-base px-8 py-3" onClick={send} disabled={sending}>
          {sending ? '⏳ Sending…' : '🚀 Send Invites via Text'}
        </button>

        {/* Results */}
        {results && (
          <div className="mt-5 space-y-3">
            {results.sent?.length > 0 && (
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-base text-emerald-950">
                ✅ <strong>{results.sent.length} sent:</strong> {results.sent.map(g => g.name).join(', ')}
              </div>
            )}
            {results.failed?.length > 0 && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-base text-red-950">
                ❌ <strong>{results.failed.length} failed:</strong>{' '}
                {results.failed.map(g => `${g.name} (${g.error})`).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

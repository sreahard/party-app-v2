import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useToast } from '../../context/ToastContext'

const PARTY_KEYS = [
  'party_title', 'party_hero_emoji', 'party_date', 'party_time',
  'party_location', 'party_address', 'party_description', 'party_updates',
]

export default function SettingsPage() {
  const toast  = useToast()
  const [form, setForm] = useState({
    party_title: '', party_hero_emoji: '🎂', party_date: '', party_time: '',
    party_location: '', party_address: '', party_description: '', party_updates: '',
  })

  useEffect(() => {
    api.party.get().then(data => {
      setForm(f => ({ ...f, ...Object.fromEntries(PARTY_KEYS.map(k => [k, data[k] ?? f[k]])) }))
    })
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    const res = await api.party.save(form)
    if (res.error) return toast(res.error, 'error')
    toast('Party details saved! Guest page updated 🎉', 'success')
  }

  const guestUrl = `${window.location.origin}/party`

  function copyLink() {
    navigator.clipboard.writeText(guestUrl).then(() => toast('Link copied! 📋', 'success'))
  }

  return (
    <div className="space-y-6">
      {/* Guest page link */}
      <div className="card bg-gradient-to-r from-brand-pink-light to-purple-50 border-purple-200">
        <h2 className="section-title">🔗 Guest Party Page</h2>
        <p className="text-sm text-gray-500 mb-3">Share this link so guests can view party details and RSVP online.</p>
        <div className="flex gap-2 flex-wrap">
          <input className="field flex-1 min-w-0 font-medium text-brand-purple"
                 readOnly value={guestUrl} />
          <button className="btn-primary" onClick={copyLink}>📋 Copy</button>
          <a href="/party" target="_blank" className="btn-secondary no-underline">↗ Preview</a>
        </div>
      </div>

      {/* Party details */}
      <div className="card">
        <h2 className="section-title">🎉 Party Details</h2>
        <p className="text-sm text-gray-400 mb-5">These appear on the guest-facing party page.</p>

        <div className="space-y-4">
          {/* Title + emoji row */}
          <div className="flex gap-4">
            <label className="flex-1">
              <span className="field-label">Page Title</span>
              <input className="field" placeholder="e.g. Celebrate Alex's 50th!"
                     value={form.party_title} onChange={set('party_title')} />
            </label>
            <label className="w-24">
              <span className="field-label">Emoji</span>
              <input className="field text-center text-2xl"
                     maxLength={4} value={form.party_hero_emoji} onChange={set('party_hero_emoji')} />
            </label>
          </div>

          {/* Date + time row */}
          <div className="flex gap-4">
            <label className="flex-1">
              <span className="field-label">Date</span>
              <input className="field" type="date"
                     value={form.party_date} onChange={set('party_date')} />
            </label>
            <label className="flex-1">
              <span className="field-label">Time</span>
              <input className="field" placeholder="e.g. 7:00 PM"
                     value={form.party_time} onChange={set('party_time')} />
            </label>
          </div>

          {/* Location + address row */}
          <div className="flex gap-4">
            <label className="flex-1">
              <span className="field-label">Venue Name</span>
              <input className="field" placeholder="e.g. The Rooftop Garden"
                     value={form.party_location} onChange={set('party_location')} />
            </label>
            <label className="flex-1">
              <span className="field-label">Full Address</span>
              <input className="field" placeholder="e.g. 123 Main St, San Francisco"
                     value={form.party_address} onChange={set('party_address')} />
            </label>
          </div>

          {/* Description */}
          <label>
            <span className="field-label">Description</span>
            <textarea className="field" rows={3}
                      placeholder="Dress code, what to expect, vibe…"
                      value={form.party_description} onChange={set('party_description')} />
          </label>

          {/* Updates */}
          <label>
            <span className="field-label">
              Host Updates{' '}
              <span className="normal-case font-normal">(separate multiple updates with a line containing just ---)</span>
            </span>
            <textarea className="field" rows={4}
                      placeholder={`Parking is available on 2nd Street.\n---\nPlease bring a dish to share!`}
                      value={form.party_updates} onChange={set('party_updates')} />
          </label>
        </div>

        <button className="btn-primary mt-5" onClick={save}>💾 Save Party Details</button>
      </div>

      {/* Twilio config */}
      <div className="card">
        <h2 className="section-title">🔧 Twilio Configuration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Credentials are stored in environment variables, not here. See the README for setup steps.
        </p>
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800 space-y-1">
          <p className="font-semibold mb-2">⚠️ Required environment variables (in server/.env):</p>
          <p><code className="bg-yellow-100 px-1 rounded">TWILIO_ACCOUNT_SID</code> — from your Twilio console</p>
          <p><code className="bg-yellow-100 px-1 rounded">TWILIO_AUTH_TOKEN</code> — from your Twilio console</p>
          <p><code className="bg-yellow-100 px-1 rounded">TWILIO_PHONE_NUMBER</code> — e.g. +14155550100</p>
          <p className="mt-2 text-xs text-yellow-600">Copy <code>server/.env.example</code> → <code>server/.env</code> and fill in your values.</p>
        </div>
      </div>

      {/* Setup instructions */}
      <div className="card">
        <h2 className="section-title">📋 Deployment Checklist</h2>
        <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
          <li>Fill in party details above and save — the guest page updates immediately.</li>
          <li>Add your Twilio credentials to <code className="bg-gray-100 px-1 rounded">server/.env</code>.</li>
          <li>Deploy to <a href="https://railway.app" target="_blank" className="text-brand-pink underline">Railway</a> or <a href="https://render.com" target="_blank" className="text-brand-pink underline">Render</a> — add env vars in their dashboard.</li>
          <li>In Twilio console, set your phone's incoming webhook to <code className="bg-gray-100 px-1 rounded">https://YOUR-APP-URL/webhook/sms</code>.</li>
          <li>Share the guest page link above with your invitees!</li>
        </ol>
      </div>
    </div>
  )
}

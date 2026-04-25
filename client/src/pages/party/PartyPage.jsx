import { useEffect, useState } from 'react'
import { api } from '../../api'
import Countdown from '../../components/Countdown'

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PartyPage() {
  const [party, setParty] = useState({})
  const [socialUnlocked, setSocialUnlocked] = useState(false)
  const [guestMessages, setGuestMessages] = useState([])
  const [guestAttendees, setGuestAttendees] = useState([])

  useEffect(() => {
    api.party.get().then(setParty)
    document.body.style.background = '#0d0015'
    return () => { document.body.style.background = '' }
  }, [])

  async function loadGuestSocial(phone) {
    const data = await api.party.guestView(phone)
    if (data.error) return
    setGuestMessages(Array.isArray(data.messages) ? data.messages : [])
    setGuestAttendees(Array.isArray(data.attendees) ? data.attendees : [])
    setSocialUnlocked(true)
  }

  const updates = (party.party_updates || '')
    .split('\n---\n')
    .map(u => u.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden"
         style={{ background: 'linear-gradient(135deg, #0d0015 0%, #1a0030 50%, #0d0015 100%)' }}>

      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-pink/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-5 pb-20">
        {/* Hero */}
        <div className="text-center pt-16 pb-10">
          <span className="block text-7xl animate-float mb-4 select-none">
            {party.party_hero_emoji || '🎂'}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight
                         bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300
                         bg-clip-text text-transparent">
            {party.party_title || "You're Invited!"}
          </h1>
          <div className="flex justify-center gap-2 mt-5 text-xl opacity-60 select-none">
            {['🎉','🥂','🎊','✨','🎈','💐'].map((e,i) => <span key={i}>{e}</span>)}
          </div>
        </div>

        {/* Party details */}
        <GlassCard>
          <SectionLabel>📍 Party Details</SectionLabel>
          {!party.party_date && !party.party_location ? (
            <p className="text-white/50 text-sm text-center py-2">Details coming soon — check back!</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {party.party_date && (
                <DetailItem icon="📅" label="Date"
                  value={new Date(party.party_date + 'T00:00:00').toLocaleDateString('en-US',
                    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
              )}
              {party.party_time && (
                <DetailItem icon="🕐" label="Time" value={party.party_time} />
              )}
              {party.party_location && (
                <DetailItem icon="📍" label="Location" value={party.party_location} sub={party.party_address} />
              )}
            </div>
          )}
        </GlassCard>

        {/* Countdown */}
        {party.party_date && (
          <GlassCard>
            <SectionLabel>⏳ Countdown</SectionLabel>
            <Countdown dateStr={party.party_date} />
          </GlassCard>
        )}

        {/* Description */}
        {party.party_description && (
          <GlassCard>
            <SectionLabel>🎉 About the Party</SectionLabel>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
              {party.party_description}
            </p>
          </GlassCard>
        )}

        {/* Updates */}
        {updates.length > 0 && (
          <GlassCard>
            <SectionLabel>📢 Updates from the Host</SectionLabel>
            <div className="space-y-3">
              {updates.map((u, i) => (
                <div key={i} className="bg-brand-gold/10 border border-brand-gold/25 rounded-xl px-4 py-3 text-sm text-white/80 leading-relaxed">
                  {u}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-8 opacity-30">
          <div className="flex-1 h-px bg-white" />
          <span className="text-xs tracking-widest uppercase">RSVP</span>
          <div className="flex-1 h-px bg-white" />
        </div>

        {/* RSVP flow */}
        <RsvpFlow
          onInviteVerified={(phone) => loadGuestSocial(phone)}
          onInviteReset={() => {
            setSocialUnlocked(false)
            setGuestMessages([])
            setGuestAttendees([])
          }}
          onMessagesMaybeChanged={(phone) => loadGuestSocial(phone)}
        />

        {/* After a valid invite phone, show who's coming + guest notes */}
        {socialUnlocked && (
          <div className="mt-8 space-y-4">
            {guestAttendees.length > 0 && (
              <GlassCard>
                <SectionLabel>🥳 Who&apos;s Coming</SectionLabel>
                <p className="text-white/45 text-xs -mt-2 mb-4 leading-relaxed">
                  Guests who&apos;ve RSVP&apos;d yes — headcounts include plus-ones.
                </p>
                <ul className="space-y-2">
                  {guestAttendees.map((a, i) => (
                    <li key={i}
                        className="flex items-center justify-between gap-3 text-sm text-white/85
                                   bg-white/[0.06] border border-white/12 rounded-xl px-4 py-2.5">
                      <span className="font-medium truncate">{a.displayName}</span>
                      <span className="shrink-0 text-xs text-white/45 tabular-nums">
                        {a.partyOf > 1 ? `Party of ${a.partyOf}` : 'Solo'}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            {guestMessages.length > 0 && (
              <GlassCard>
                <SectionLabel>💬 Notes from Guests</SectionLabel>
                <p className="text-white/45 text-xs -mt-2 mb-4 leading-relaxed">
                  Kind words and messages people shared when they RSVP&apos;d.
                </p>
                <div className="space-y-3">
                  {guestMessages.map((m, i) => (
                    <div key={i}
                         className="bg-white/[0.06] border border-white/12 rounded-xl px-4 py-3 text-sm text-white/80 leading-relaxed">
                      <p className="whitespace-pre-wrap">{m.note}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-white/40">
                        <span>— {m.firstName}</span>
                        <span title="RSVP" className="shrink-0 opacity-70">
                          {m.rsvp === 'yes' ? '🥳' : m.rsvp === 'maybe' ? '🤞' : '💙'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {guestAttendees.length === 0 && guestMessages.length === 0 && (
              <p className="text-center text-white/40 text-sm px-2 leading-relaxed">
                You&apos;re in! When guests RSVP yes or leave notes, they&apos;ll show up here.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── RSVP Flow ──────────────────────────────────────────────────────────────────
function RsvpFlow({ onInviteVerified, onInviteReset, onMessagesMaybeChanged }) {
  const [step,       setStep]       = useState('phone') // phone | form | done | notfound
  const [phone,      setPhone]      = useState('')
  const [guest,      setGuest]      = useState(null)
  const [status,     setStatus]     = useState(null)   // yes | no | maybe
  const [guestCount, setGuestCount] = useState(1)
  const [note,       setNote]       = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  async function lookup() {
    setError('')
    setLoading(true)
    const res = await api.rsvp.lookup(phone)
    if (res.error === 'not_found') {
      setLoading(false)
      return setStep('notfound')
    }
    if (res.error) {
      setLoading(false)
      return setError(res.error)
    }
    setGuest(res)
    await onInviteVerified?.(phone)
    // Pre-fill existing RSVP
    if (res.rsvp_status !== 'pending') {
      setStatus(res.rsvp_status)
      setGuestCount((res.plus_ones ?? 0) + 1)
      setNote(res.note ?? '')
    }
    setStep('form')
    setLoading(false)
  }

  async function submit() {
    if (!status) return setError('Please choose an option above.')
    setError('')
    setLoading(true)
    const res = await api.rsvp.submit({
      phone,
      rsvp_status: status,
      plus_ones:   status === 'yes' ? guestCount - 1 : 0,
      note,
    })
    setLoading(false)
    if (res.error) return setError(res.error)
    setGuest(res)
    setStep('done')
    onMessagesMaybeChanged?.(phone)
  }

  function reset() {
    onInviteReset?.()
    setStep('phone'); setPhone(''); setGuest(null)
    setStatus(null); setGuestCount(1); setNote(''); setError('')
  }

  /** From confirmation screen: edit RSVP without re-entering phone. */
  async function backToEdit() {
    setError('')
    if (!phone.trim()) return reset()
    setLoading(true)
    const res = await api.rsvp.lookup(phone)
    setLoading(false)
    if (res.error) return reset()
    setGuest(res)
    await onInviteVerified?.(phone)
    if (res.rsvp_status !== 'pending') {
      setStatus(res.rsvp_status)
      setGuestCount((res.plus_ones ?? 0) + 1)
      setNote(res.note ?? '')
    } else {
      setStatus(null)
      setGuestCount(1)
      setNote('')
    }
    setStep('form')
  }

  if (step === 'phone') return (
    <GlassCard>
      <h2 className="text-xl font-bold text-center mb-1">RSVP Now 💌</h2>
      <p className="text-center text-white/50 text-sm mb-6">Enter the phone number your invite was sent to</p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <label className="block mb-4">
        <span className="text-xs uppercase tracking-wider text-white/50 mb-1.5 block">Your Phone Number</span>
        <input className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white
                          placeholder-white/30 focus:outline-none focus:border-brand-pink focus:ring-2
                          focus:ring-brand-pink/30 transition"
               type="tel" placeholder="e.g. 415-555-0100"
               value={phone} onChange={e => setPhone(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && lookup()} />
      </label>
      <PinkButton onClick={lookup} loading={loading}>Find My Invite →</PinkButton>
    </GlassCard>
  )

  if (step === 'notfound') return (
    <GlassCard>
      <div className="text-center py-4">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-bold mb-2">We couldn't find your invite</h3>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          We don't have a record for that number. Make sure you're using the same number the invite was sent to, or contact the host.
        </p>
        <button onClick={reset}
                className="text-sm text-brand-pink border border-brand-pink/40 px-4 py-2 rounded-xl hover:bg-brand-pink/10 transition">
          ← Try a different number
        </button>
      </div>
    </GlassCard>
  )

  if (step === 'form') return (
    <GlassCard>
      <p className="text-center font-semibold mb-6">
        Hi {guest?.name.split(' ')[0]}! 👋 Will you be there?
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}

      {/* Yes / No / Maybe */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { s: 'yes',   emoji: '🥳', label: "Yes!",        sub: "I'll be there",  sel: 'border-green-400 bg-green-500/15' },
          { s: 'no',    emoji: '😢', label: "Can't make it", sub: 'So sorry!',    sel: 'border-red-400 bg-red-500/15' },
          { s: 'maybe', emoji: '🤞', label: "Maybe",        sub: "I'll try!",     sel: 'border-yellow-400 bg-yellow-500/15' },
        ].map(({ s, emoji, label, sub, sel }) => (
          <button key={s} onClick={() => setStatus(s)}
                  className={`border-2 rounded-2xl py-4 px-2 text-center transition cursor-pointer
                              ${status === s ? sel : 'border-white/20 hover:border-brand-pink/60'}`}>
            <div className="text-3xl mb-1.5">{emoji}</div>
            <div className="text-xs font-bold">{label}</div>
            <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>
          </button>
        ))}
      </div>

      {/* Guest count stepper (only for YES) */}
      {status === 'yes' && (
        <div className="mb-5">
          <span className="text-xs uppercase tracking-wider text-white/50 mb-2 block">
            How many guests total (including yourself)?
          </span>
          <div className="flex items-center gap-4 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
            <button onClick={() => setGuestCount(c => Math.max(1, c - 1))}
                    className="w-9 h-9 rounded-full border border-white/20 hover:border-brand-pink
                               hover:bg-brand-pink/20 transition text-lg flex items-center justify-center">
              −
            </button>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold">{guestCount}</div>
              <div className="text-xs text-white/40">
                {guestCount === 1 ? 'Just me' : `Me + ${guestCount - 1} guest${guestCount > 2 ? 's' : ''}`}
              </div>
            </div>
            <button onClick={() => setGuestCount(c => Math.min(20, c + 1))}
                    className="w-9 h-9 rounded-full border border-white/20 hover:border-brand-pink
                               hover:bg-brand-pink/20 transition text-lg flex items-center justify-center">
              +
            </button>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="mb-5">
        <span className="text-xs uppercase tracking-wider text-white/50 mb-1.5 block">
          Message for the host (optional)
        </span>
        <textarea className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white
                             placeholder-white/30 focus:outline-none focus:border-brand-pink focus:ring-2
                             focus:ring-brand-pink/30 transition resize-none text-sm"
                  rows={3} placeholder="Dietary needs, song requests, a kind word…💙"
                  value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <PinkButton onClick={submit} loading={loading}>
        {guest?.rsvp_status !== 'pending' ? 'Update my RSVP' : 'Send My RSVP 🎉'}
      </PinkButton>
      <button onClick={reset}
              className="w-full mt-3 text-sm text-white/40 hover:text-white/70 transition py-2">
        ← Use a different number
      </button>
    </GlassCard>
  )

  if (step === 'done') {
    const msgs = {
      yes:   { emoji: '🎉', title: `See you there, ${guest?.name.split(' ')[0]}!`,  body: "Your RSVP is confirmed — we can't wait to celebrate with you!" },
      no:    { emoji: '💙', title: `We'll miss you, ${guest?.name.split(' ')[0]}!`, body: "Thanks for letting us know. We'll be thinking of you!" },
      maybe: { emoji: '🤞', title: `Fingers crossed!`,                              body: "We've got you down as a maybe. Let us know when you decide!" },
    }
    const m = msgs[guest?.rsvp_status] ?? msgs.yes
    return (
      <GlassCard>
        <div className="text-center py-4">
          <span className="block text-6xl animate-float mb-4">{m.emoji}</span>
          <h3 className="text-xl font-bold mb-2">{m.title}</h3>
          <p className="text-white/50 text-sm leading-relaxed mb-6">{m.body}</p>
          {guest?.plus_ones > 0 && (
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 text-sm mb-6">
              ✓ Party of {guest.plus_ones + 1}
            </div>
          )}
          <br />
          <button onClick={backToEdit} disabled={loading}
                  className="text-sm text-brand-pink border border-brand-pink/40 px-4 py-2 rounded-xl hover:bg-brand-pink/10 transition disabled:opacity-50">
            {loading ? 'Loading…' : 'Update my RSVP'}
          </button>
        </div>
      </GlassCard>
    )
  }

  return null
}

// ── Small reusable sub-components ──────────────────────────────────────────────
function GlassCard({ children }) {
  return (
    <div className="bg-white/[0.07] backdrop-blur-md border border-white/15 rounded-2xl p-6 mb-4">
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return <div className="text-xs font-bold uppercase tracking-widest text-brand-pink mb-4">{children}</div>
}

function DetailItem({ icon, label, value, sub }) {
  return (
    <div className="flex gap-3">
      <span className="text-2xl leading-none">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">{label}</div>
        <div className="font-semibold text-sm leading-snug">{value}</div>
        {sub && <div className="text-xs text-white/40 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function PinkButton({ onClick, loading, children }) {
  return (
    <button onClick={onClick} disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-base transition
                       bg-gradient-to-r from-brand-pink to-brand-purple
                       hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-pink/30
                       active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed">
      {loading ? '⏳ Just a moment…' : children}
    </button>
  )
}

function ErrorBox({ children }) {
  return (
    <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 mb-4">
      {children}
    </div>
  )
}

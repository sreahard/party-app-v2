import { useEffect, useState } from 'react'
import { api } from '../../api'
import Countdown from '../../components/Countdown'

export default function PartyPage() {
  const [party, setParty] = useState({})
  const [socialUnlocked, setSocialUnlocked] = useState(false)
  const [guestMessages, setGuestMessages] = useState([])
  const [guestAttendees, setGuestAttendees] = useState([])

  useEffect(() => {
    api.party.get().then(setParty)
    document.body.classList.add('party-guest-bg')
    return () => document.body.classList.remove('party-guest-bg')
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
    <div
      className="relative min-h-screen overflow-x-hidden text-brand-ocean"
      style={{ background: 'var(--party-page-gradient)' }}>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-[22rem] w-[22rem] rounded-full bg-brand-coral-wash/50 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 h-[24rem] w-[24rem] rounded-full bg-brand-sea-mist/40 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-gold-light/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-5 pb-24">
        <div className="pb-10 pt-16 text-center">
          <span className="mb-5 block select-none text-6xl sm:text-7xl animate-float">
            {party.party_hero_emoji || '🎂'}
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-brand-ocean sm:text-5xl md:text-6xl">
            {party.party_title || "You're Invited"}
          </h1>
          <div className="mt-8 flex select-none justify-center gap-3 text-2xl opacity-90">
            {['🌊', '🐚', '☀️', '🥂', '✨', '🌴'].map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
        </div>

        <GlassCard>
          <SectionLabel>Details</SectionLabel>
          {!party.party_date && !party.party_location ? (
            <p className="py-2 text-center text-base text-brand-subtle">Details coming soon — check back shortly.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {party.party_date && (
                <DetailItem
                  icon="📅"
                  label="Date"
                  value={new Date(party.party_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                />
              )}
              {party.party_time && <DetailItem icon="🕐" label="Time" value={party.party_time} />}
              {party.party_location && (
                <DetailItem icon="📍" label="Location" value={party.party_location} sub={party.party_address} />
              )}
            </div>
          )}
        </GlassCard>

        {party.party_date && (
          <GlassCard>
            <SectionLabel>Countdown</SectionLabel>
            <Countdown dateStr={party.party_date} />
          </GlassCard>
        )}

        {party.party_description && (
          <GlassCard>
            <SectionLabel>About</SectionLabel>
            <p className="whitespace-pre-wrap text-lg leading-relaxed text-brand-ink">
              {party.party_description}
            </p>
          </GlassCard>
        )}

        {updates.length > 0 && (
          <GlassCard>
            <SectionLabel>From the host</SectionLabel>
            <div className="space-y-3">
              {updates.map((u, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-base leading-relaxed text-brand-ink">
                  {u}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-sea/60" />
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-ocean">RSVP</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-sea/60" />
        </div>

        <RsvpFlow
          onInviteVerified={(phone) => loadGuestSocial(phone)}
          onInviteReset={() => {
            setSocialUnlocked(false)
            setGuestMessages([])
            setGuestAttendees([])
          }}
          onMessagesMaybeChanged={(phone) => loadGuestSocial(phone)}
        />

        {socialUnlocked && (
          <div className="mt-8 space-y-4">
            {guestAttendees.length > 0 && (
              <GlassCard>
                <SectionLabel>Who&apos;s coming</SectionLabel>
                <p className="-mt-2 mb-4 text-base leading-relaxed text-brand-subtle">
                  Guests who&apos;ve said yes — headcounts include plus-ones.
                </p>
                <ul className="space-y-2">
                  {guestAttendees.map((a, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl border border-brand-sea-mist/80 bg-white/90 px-4 py-3 text-base text-brand-ink">
                      <span className="truncate font-semibold">{a.displayName}</span>
                      <span className="shrink-0 tabular-nums text-sm font-medium text-brand-subtle">
                        {a.partyOf > 1 ? `Party of ${a.partyOf}` : 'Solo'}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            {guestMessages.length > 0 && (
              <GlassCard>
                <SectionLabel>Guest notes</SectionLabel>
                <p className="-mt-2 mb-4 text-base leading-relaxed text-brand-subtle">
                  Kind words from people who RSVP&apos;d.
                </p>
                <div className="space-y-3">
                  {guestMessages.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-brand-sea-mist/80 bg-white/90 px-4 py-3 text-base leading-relaxed text-brand-ink">
                      <p className="whitespace-pre-wrap">{m.note}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-sm text-brand-subtle">
                        <span>— {m.firstName}</span>
                        <span title="RSVP" className="shrink-0 opacity-80">
                          {m.rsvp === 'yes' ? '🥂' : m.rsvp === 'maybe' ? '🤞' : '💙'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {guestAttendees.length === 0 && guestMessages.length === 0 && (
              <p className="px-2 text-center text-base leading-relaxed text-brand-subtle">
                You&apos;re in. When guests RSVP or leave notes, they&apos;ll appear here.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RsvpFlow({ onInviteVerified, onInviteReset, onMessagesMaybeChanged }) {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [guest, setGuest] = useState(null)
  const [status, setStatus] = useState(null)
  const [guestCount, setGuestCount] = useState(1)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      plus_ones: status === 'yes' ? guestCount - 1 : 0,
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
    setStep('phone')
    setPhone('')
    setGuest(null)
    setStatus(null)
    setGuestCount(1)
    setNote('')
    setError('')
  }

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

  if (step === 'phone')
    return (
      <GlassCard>
        <h2 className="mb-1 text-center text-3xl font-bold text-brand-ocean">RSVP</h2>
        <p className="mb-6 text-center text-lg text-brand-subtle">
          Enter the phone number your invitation was sent to.
        </p>
        {error && <ErrorBox>{error}</ErrorBox>}
        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-brand-ocean">
            Phone number
          </span>
          <input
            className="w-full rounded-xl border-2 border-brand-sea-mist bg-white px-4 py-3.5 text-lg text-brand-ink placeholder:text-brand-muted transition focus:border-brand-sea focus:outline-none focus:ring-2 focus:ring-brand-sea/30"
            type="tel"
            placeholder="e.g. 415-555-0100"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
          />
        </label>
        <PrimaryButton onClick={lookup} loading={loading}>
          Find my invite
        </PrimaryButton>
      </GlassCard>
    )

  if (step === 'notfound')
    return (
      <GlassCard>
        <div className="py-4 text-center">
          <div className="mb-4 text-5xl opacity-80">🔍</div>
          <h3 className="mb-2 text-2xl font-bold text-brand-ocean">We couldn&apos;t find your invite</h3>
          <p className="mb-6 text-lg leading-relaxed text-brand-subtle">
            We don&apos;t have a record for that number. Use the same number the host texted, or reach out to them directly.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border-2 border-brand-coral bg-white px-4 py-3 text-base font-semibold text-brand-coral transition hover:bg-brand-coral-wash/80">
            Try a different number
          </button>
        </div>
      </GlassCard>
    )

  if (step === 'form')
    return (
      <GlassCard>
        <p className="mb-6 text-center text-xl font-semibold text-brand-ink">
          Hi {guest?.name.split(' ')[0]} — will you join us?
        </p>
        {error && <ErrorBox>{error}</ErrorBox>}

        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { s: 'yes', emoji: '🥂', label: 'Joyfully yes', sub: "I'll be there", sel: 'border-emerald-400 bg-emerald-50/90 ring-1 ring-emerald-200/80' },
            { s: 'no', emoji: '💙', label: 'Regretfully no', sub: "Can't make it", sel: 'border-rose-300 bg-rose-50/90 ring-1 ring-rose-200/80' },
            { s: 'maybe', emoji: '🤞', label: 'Maybe', sub: 'Working on it', sel: 'border-amber-300 bg-amber-50/90 ring-1 ring-amber-200/80' },
          ].map(({ s, emoji, label, sub, sel }) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`cursor-pointer rounded-2xl border-2 px-2 py-4 text-center transition sm:px-2 ${
                status === s ? sel : 'border-brand-sea-mist/60 bg-white/40 hover:border-brand-sea/50'
              }`}>
              <div className="mb-1.5 text-2xl sm:text-3xl">{emoji}</div>
              <div className="text-sm font-bold leading-tight text-brand-ink">{label}</div>
              <div className="mt-0.5 text-xs font-medium text-brand-subtle">{sub}</div>
            </button>
          ))}
        </div>

        {status === 'yes' && (
          <div className="mb-5">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-brand-ocean">
              Guests total (including you)
            </span>
            <div className="flex items-center gap-4 rounded-xl border border-brand-sea-mist/80 bg-white/70 px-4 py-3">
              <button
                type="button"
                onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-sea-mist text-lg transition hover:border-brand-sea hover:bg-brand-mist/80">
                −
              </button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-brand-ocean">{guestCount}</div>
                <div className="text-sm font-medium text-brand-subtle">
                  {guestCount === 1 ? 'Just me' : `Me + ${guestCount - 1} guest${guestCount > 2 ? 's' : ''}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuestCount((c) => Math.min(20, c + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-sea-mist text-lg transition hover:border-brand-sea hover:bg-brand-mist/80">
                +
              </button>
            </div>
          </div>
        )}

        <div className="mb-5">
          <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-brand-ocean">
            Note for the host (optional)
          </span>
          <textarea
            className="w-full resize-none rounded-xl border-2 border-brand-sea-mist bg-white px-4 py-3.5 text-lg text-brand-ink placeholder:text-brand-muted transition focus:border-brand-sea focus:outline-none focus:ring-2 focus:ring-brand-sea/30"
            rows={3}
            placeholder="Dietary needs, a toast, or a kind word…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <PrimaryButton onClick={submit} loading={loading}>
          {guest?.rsvp_status !== 'pending' ? 'Update RSVP' : 'Send RSVP'}
        </PrimaryButton>
        <button
          type="button"
          onClick={reset}
          className="mt-3 w-full py-2 text-base font-semibold text-brand-subtle underline-offset-2 transition hover:text-brand-ink hover:underline">
          Use a different number
        </button>
      </GlassCard>
    )

  if (step === 'done') {
    const msgs = {
      yes: {
        emoji: '🥂',
        title: `See you there, ${guest?.name.split(' ')[0]}`,
        body: 'Your RSVP is saved. We cannot wait to celebrate with you.',
      },
      no: {
        emoji: '💙',
        title: `We'll miss you, ${guest?.name.split(' ')[0]}`,
        body: 'Thank you for letting us know. You will be with us in spirit.',
      },
      maybe: {
        emoji: '🤞',
        title: 'Fingers crossed',
        body: "We've noted a maybe — update us whenever you can.",
      },
    }
    const m = msgs[guest?.rsvp_status] ?? msgs.yes
    return (
      <GlassCard>
        <div className="py-4 text-center">
          <span className="mb-4 block animate-float text-6xl">{m.emoji}</span>
          <h3 className="mb-2 text-2xl font-bold text-brand-ocean">{m.title}</h3>
          <p className="mb-6 text-lg leading-relaxed text-brand-subtle">{m.body}</p>
          {guest?.plus_ones > 0 && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-brand-sea-mist/80 bg-white/90 px-4 py-2.5 text-base font-semibold text-brand-ink">
              Party of {guest.plus_ones + 1}
            </div>
          )}
          <br />
          <button
            type="button"
            onClick={backToEdit}
            disabled={loading}
            className="rounded-xl border-2 border-brand-coral bg-white px-4 py-3 text-base font-semibold text-brand-coral transition hover:bg-brand-coral-wash/80 disabled:opacity-50">
            {loading ? 'Loading…' : 'Update RSVP'}
          </button>
        </div>
      </GlassCard>
    )
  }

  return null
}

function GlassCard({ children }) {
  return (
    <div className="mb-4 rounded-2xl border border-white/90 bg-white/85 p-7 shadow-lg shadow-brand-ocean/10 backdrop-blur-md">
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-ocean">{children}</div>
  )
}

function DetailItem({ icon, label, value, sub }) {
  return (
    <div className="flex gap-3">
      <span className="text-2xl leading-none opacity-90">{icon}</span>
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-muted">{label}</div>
        <div className="text-lg font-semibold leading-snug text-brand-ink">{value}</div>
        {sub && <div className="mt-1 text-base text-brand-subtle">{sub}</div>}
      </div>
    </div>
  )
}

function PrimaryButton({ onClick, loading, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-xl bg-brand-sea py-4 text-lg font-bold tracking-wide text-white shadow-md shadow-brand-sea/25 transition hover:-translate-y-0.5 hover:bg-brand-ocean-soft hover:shadow-lg hover:shadow-brand-sea/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
      {loading ? 'One moment…' : children}
    </button>
  )
}

function ErrorBox({ children }) {
  return (
    <div className="mb-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-base font-medium text-red-950">{children}</div>
  )
}

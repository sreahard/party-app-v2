import { useEffect, useState } from 'react'
import { api } from '../../api'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'

export default function DashboardPage() {
  const [stats,   setStats]   = useState(null)
  const [guests,  setGuests]  = useState([])

  useEffect(() => {
    api.stats().then(setStats)
    api.guests.list().then(setGuests)
  }, [])

  const responded  = (stats?.yes ?? 0) + (stats?.no ?? 0)
  const pct        = stats?.total > 0 ? Math.round((responded / stats.total) * 100) : 0
  const guestRows = Array.isArray(guests) ? guests : []
  const recentRsvps = guestRows
    .filter((g) => g.rsvp_status !== 'pending' && g.responded_at)
    .sort((a, b) => new Date(b.responded_at) - new Date(a.responded_at))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard num={stats?.invited}         label="Invited"        color="text-brand-ocean-soft" />
        <StatCard num={stats?.yes}             label="Coming ✓"       color="text-emerald-900" />
        <StatCard num={stats?.no}              label="Can't Make It"  color="text-red-800" />
        <StatCard num={stats?.pending}         label="Awaiting Reply" color="text-amber-900" />
        <StatCard num={stats?.total_headcount} label="Total Headcount" color="text-brand-coral" />
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between text-base">
          <span className="font-semibold text-brand-ink">RSVP Progress</span>
          <span className="text-brand-muted">{responded} of {stats?.total ?? 0} responded ({pct}%)</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand-sea-mist/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-sea to-brand-ocean transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Recent RSVPs */}
      <div className="card">
        <h2 className="section-title">📬 Recent RSVPs</h2>
        {recentRsvps.length === 0 ? (
          <Empty emoji="📭" message="No RSVPs yet — send your invites to get started!" />
        ) : (
          <ul className="divide-y divide-brand-sea-mist/60">
            {recentRsvps.map(g => (
              <li key={g.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-base font-semibold text-brand-ink">{g.name}</span>
                  {g.note && <span className="ml-2 text-sm text-brand-muted">— {g.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  {g.plus_ones > 0 && <span className="text-sm font-medium text-brand-muted">+{g.plus_ones}</span>}
                  <Badge status={g.rsvp_status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Empty({ emoji, message }) {
  return (
    <div className="py-10 text-center text-brand-muted">
      <div className="mb-3 text-4xl">{emoji}</div>
      <p className="text-base">{message}</p>
    </div>
  )
}

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
  const recentRsvps = [...guests]
    .filter(g => g.rsvp_status !== 'pending' && g.responded_at)
    .sort((a, b) => new Date(b.responded_at) - new Date(a.responded_at))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard num={stats?.invited}         label="Invited"        color="text-brand-purple" />
        <StatCard num={stats?.yes}             label="Coming ✓"       color="text-green-600" />
        <StatCard num={stats?.no}              label="Can't Make It"  color="text-red-500" />
        <StatCard num={stats?.pending}         label="Awaiting Reply" color="text-yellow-500" />
        <StatCard num={stats?.total_headcount} label="Total Headcount" color="text-brand-pink" />
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="font-medium">RSVP Progress</span>
          <span className="text-gray-400">{responded} of {stats?.total ?? 0} responded ({pct}%)</span>
        </div>
        <div className="h-2.5 bg-brand-pink-light rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-pink to-brand-purple rounded-full transition-all duration-700"
               style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Recent RSVPs */}
      <div className="card">
        <h2 className="section-title">📬 Recent RSVPs</h2>
        {recentRsvps.length === 0 ? (
          <Empty emoji="📭" message="No RSVPs yet — send your invites to get started!" />
        ) : (
          <ul className="divide-y divide-brand-pink-light">
            {recentRsvps.map(g => (
              <li key={g.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-sm">{g.name}</span>
                  {g.note && <span className="text-xs text-gray-400 ml-2">— {g.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  {g.plus_ones > 0 && <span className="text-xs text-gray-400">+{g.plus_ones}</span>}
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
    <div className="text-center py-10 text-gray-400">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

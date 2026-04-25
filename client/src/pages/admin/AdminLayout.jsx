import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/admin',          label: '📊 Dashboard', end: true },
  { to: '/admin/guests',   label: '👥 Guests' },
  { to: '/admin/invite',   label: '✉️ Send Invites' },
  { to: '/admin/settings', label: '⚙️ Settings' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-pink-light/40 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-pink to-brand-purple text-white px-8 py-5
                         flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-xl font-bold tracking-tight">🎂 Birthday Party RSVP</h1>
          <p className="text-white/75 text-xs mt-0.5">Your party dashboard</p>
        </div>
        <a href="/party" target="_blank"
           className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition">
          ↗ Guest Page
        </a>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-brand-pink-light px-8 flex gap-0">
        {NAV.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-pink text-brand-pink'
                  : 'border-transparent text-gray-500 hover:text-brand-pink hover:border-brand-pink/40'
              }`
            }>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <main className="max-w-5xl mx-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}

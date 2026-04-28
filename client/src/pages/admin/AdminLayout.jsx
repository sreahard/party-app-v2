import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/guests', label: 'Guests' },
  { to: '/admin/invite', label: 'Send Invites' },
  { to: '/admin/settings', label: 'Settings' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-shell via-brand-sand to-brand-mist/80">
      <header
        className="relative overflow-hidden border-b border-white/20 bg-gradient-to-r from-brand-ocean via-brand-ocean-soft to-brand-ocean px-8 py-6 text-white shadow-md shadow-brand-ocean/20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-white/85">Gatherings</p>
            <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">Party RSVP</h1>
            <p className="mt-1.5 text-base font-normal text-white/90">Host dashboard</p>
          </div>
          <a
            href="/party"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-white transition hover:bg-white/20">
            Guest page →
          </a>
        </div>
      </header>

      <nav className="flex gap-0 border-b border-brand-sea-mist/60 bg-white/70 px-4 backdrop-blur-md sm:px-8">
        {NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `border-b-2 px-4 py-4 text-base font-medium transition-colors ${
                isActive
                  ? 'border-brand-coral text-brand-coral'
                  : 'border-transparent text-brand-muted hover:border-brand-sea-mist hover:text-brand-ink'
              }`
            }>
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto max-w-5xl p-6 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}

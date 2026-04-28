// All API calls go through here.
// Dev: Vite proxies /api → VITE_API_PROXY_TARGET (default http://127.0.0.1:3000). Run the Express server.
// Prod (same host as Express): leave VITE_API_URL unset so requests stay same-origin.
// Split UI deploy: set VITE_API_URL to your Express origin before `npm run build`.
const BASE = import.meta.env.VITE_API_URL || ''

function isForeignApi404(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.statusCode === 'number' &&
    typeof data.message === 'string' &&
    data.message.includes('Route ') &&
    data.message.includes(' not found')
  )
}

function warnWrongServer(path, status, data) {
  if (status === 404 && isForeignApi404(data)) {
    console.error(
      `[party-app] ${path} returned a 404 from a server that is not this app’s Express API (wrong port or VITE_API_URL). ` +
        'Fix: run `npm run dev` from the repo root (starts API + UI), or only `npm run dev:server` in /server and set client/.env VITE_API_PROXY_TARGET to that URL. ' +
        'Production: deploy this repo’s Node server (same host as the UI) or point VITE_API_URL at it before building the client.'
    )
  }
}

async function req(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) warnWrongServer(path, res.status, data)
  return data
}

function emptyStats() {
  return { total: 0, yes: 0, no: 0, pending: 0, invited: 0, total_headcount: 0 }
}

export const api = {
  guests: {
    list: async () => {
      const data = await req('/api/guests')
      return Array.isArray(data) ? data : []
    },
    add: (data) => req('/api/guests', 'POST', data),
    update: (id, data) => req(`/api/guests/${id}`, 'PUT', data),
    remove: (id) => req(`/api/guests/${id}`, 'DELETE'),
    importBulk: (guests) => req('/api/guests/import', 'POST', { guests }),
  },
  stats: async () => {
    const data = await req('/api/stats')
    if (
      data &&
      typeof data === 'object' &&
      typeof data.total === 'number' &&
      typeof data.yes === 'number' &&
      !isForeignApi404(data)
    ) {
      return data
    }
    return emptyStats()
  },
  settings: {
    getAll: async () => {
      const data = await req('/api/settings')
      if (data && typeof data === 'object' && !Array.isArray(data) && !isForeignApi404(data)) return data
      return {}
    },
    set: (key, value) => req('/api/settings', 'POST', { key, value }),
  },
  party: {
    get: async () => {
      const data = await req('/api/party')
      if (data && typeof data === 'object' && !isForeignApi404(data)) return data
      return {}
    },
    save: (data) => req('/api/party', 'POST', data),
    guestView: (phone) => req('/api/party/guest-view', 'POST', { phone }),
  },
  invites: {
    send: (data) => req('/api/send-invites', 'POST', data),
  },
  rsvp: {
    lookup: (phone) => req('/api/rsvp/lookup', 'POST', { phone }),
    submit: (data) => req('/api/rsvp/submit', 'POST', data),
  },
}

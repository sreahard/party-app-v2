// All API calls go through here.
// In dev, Vite proxies /api → localhost:3000.
// In production (split deploy), set VITE_API_URL to your server's URL.
const BASE = import.meta.env.VITE_API_URL || ''

async function req(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  return res.json()
}

export const api = {
  guests: {
    list:        ()         => req('/api/guests'),
    add:         (data)     => req('/api/guests',         'POST', data),
    update:      (id, data) => req(`/api/guests/${id}`,   'PUT',  data),
    remove:      (id)       => req(`/api/guests/${id}`,   'DELETE'),
    importBulk:  (guests)   => req('/api/guests/import',  'POST', { guests }),
  },
  stats:   ()       => req('/api/stats'),
  settings: {
    getAll: ()           => req('/api/settings'),
    set:    (key, value) => req('/api/settings', 'POST', { key, value }),
  },
  party: {
    get:        ()          => req('/api/party'),
    save:       (data)      => req('/api/party', 'POST', data),
    guestView:  (phone)     => req('/api/party/guest-view', 'POST', { phone }),
  },
  invites: {
    send: (data) => req('/api/send-invites', 'POST', data),
  },
  rsvp: {
    lookup: (phone) => req('/api/rsvp/lookup', 'POST', { phone }),
    submit: (data)  => req('/api/rsvp/submit', 'POST', data),
  },
}

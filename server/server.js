require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Database = require('better-sqlite3');
const twilio = require('twilio');
const path = require('path');
const fs = require('fs');

function isAdminPath(p) {
  return p === '/admin' || p.startsWith('/admin/');
}

function timingSafeEqualStr(a, b) {
  try {
    const ba = Buffer.from(String(a), 'utf8');
    const bb = Buffer.from(String(b), 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** When ADMIN_BASIC_USER and ADMIN_BASIC_PASSWORD are set, require Basic auth for /admin. */
function basicAuthAdmin(req, res, next) {
  if (!isAdminPath(req.path)) return next();
  const user = process.env.ADMIN_BASIC_USER;
  const pass = process.env.ADMIN_BASIC_PASSWORD;
  if (!user || !pass) return next();

  const hdr = req.headers.authorization || '';
  const m = /^Basic\s+(.+)$/i.exec(hdr);
  if (!m) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Authentication required');
  }
  let decoded;
  try {
    decoded = Buffer.from(m[1], 'base64').toString('utf8');
  } catch {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Invalid credentials');
  }
  const colon = decoded.indexOf(':');
  const u = colon === -1 ? decoded : decoded.slice(0, colon);
  const p = colon === -1 ? '' : decoded.slice(colon + 1);
  if (timingSafeEqualStr(u, user) && timingSafeEqualStr(p, pass)) return next();

  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Invalid credentials');
}

const app = express();
const PORT = process.env.PORT || 3000;
// Behind Railway / reverse proxies — correct req.secure, X-Forwarded-* (does not set cache headers).
app.set('trust proxy', 1);

// ─── CORS ──────────────────────────────────────────────────────────────────────
// Delegated config so we can read Host: same-origin browser fetches (SPA + API on one Railway
// URL) send Origin: https://<this-host>, which was not covered by localhost + CLIENT_ORIGIN only.
app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    const host = req.get('host');
    const selfOrigin = host ? `${req.protocol}://${host}` : null;

    const allowList = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    if (process.env.CLIENT_ORIGIN) allowList.push(process.env.CLIENT_ORIGIN.trim());

    const allow =
      !origin ||
      allowList.includes(origin) ||
      (selfOrigin && origin === selfOrigin);

    // `origin: false` is misread by cors as "falsy → *"; use [] to deny. `true` reflects the request Origin.
    callback(null, {
      origin: allow ? true : [],
      credentials: false,
    });
  })
);

// ─── Database ──────────────────────────────────────────────────────────────────
const db = new Database('rsvp.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS guests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    phone       TEXT    NOT NULL UNIQUE,
    rsvp_status TEXT    DEFAULT 'pending',
    plus_ones   INTEGER DEFAULT 0,
    note        TEXT    DEFAULT '',
    invited_at  TEXT    DEFAULT NULL,
    responded_at TEXT   DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed default invite message
if (!db.prepare("SELECT 1 FROM settings WHERE key='invite_message'").get()) {
  db.prepare("INSERT INTO settings (key,value) VALUES (?,?)").run(
    'invite_message',
    "Hi {name}! 🎉 You're invited to celebrate a very special 50th birthday! Join us for a night of fun and memories. Reply YES to confirm, or NO if you can't make it. We hope to see you!"
  );
}

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

function resolveClientDist() {
  if (process.env.CLIENT_DIST) {
    return path.resolve(process.cwd(), process.env.CLIENT_DIST);
  }
  // Prefer Vite outDir (../server/public from client); fallback to legacy client/dist for old builds.
  const cohosted = path.join(__dirname, 'public');
  const legacy = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(path.join(cohosted, 'index.html'))) return cohosted;
  if (fs.existsSync(path.join(legacy, 'index.html'))) return legacy;
  return cohosted;
}

const clientDist = resolveClientDist();

if (!fs.existsSync(path.join(clientDist, 'index.html'))) {
  console.warn(
    `[party-app] Client build missing at ${clientDist} (cwd=${process.cwd()}). ` +
      'Run "npm run build" from the repo root on deploy, or set CLIENT_DIST.'
  );
}

const assetsPath = path.join(clientDist, 'assets');
if (fs.existsSync(assetsPath)) {
  const names = fs.readdirSync(assetsPath);
  console.log(
    `[party-app] ${names.length} file(s) in assets/: ${names.slice(0, 8).join(', ')}${names.length > 8 ? '…' : ''}`
  );
} else if (fs.existsSync(clientDist)) {
  const top = fs.readdirSync(clientDist);
  console.warn(
    `[party-app] No assets/ folder under ${clientDist}. Top-level files: ${top.join(', ') || '(empty)'} — run "npm run build" from repo root (Vite must emit under public/assets/).`
  );
}

app.use(basicAuthAdmin);

// Vite JS/CSS under /assets/ — dedicated static mount (avoids hand-rolled sendFile edge cases → 500).
const assetsDir = path.join(clientDist, 'assets');
app.use(
  '/assets',
  express.static(assetsDir, {
    index: false,
    maxAge: '365d',
    immutable: true,
    fallthrough: true,
  })
);

// Serve the built React app in production (remaining static files, e.g. favicon)
app.use(express.static(clientDist, {
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith(`${path.sep}index.html`) || path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────
function normalizePhone(phone) {
  let c = String(phone).replace(/[^\d+]/g, '');
  if (/^\d{10}$/.test(c))  c = '+1' + c;
  if (/^1\d{10}$/.test(c)) c = '+' + c;
  return /^\+\d{10,15}$/.test(c) ? c : null;
}

// ─── Guests ────────────────────────────────────────────────────────────────────
app.get('/api/guests', (_req, res) => {
  res.json(db.prepare('SELECT * FROM guests ORDER BY name ASC').all());
});

app.post('/api/guests', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
  const p = normalizePhone(phone);
  if (!p) return res.status(400).json({ error: 'Invalid phone number' });
  try {
    const { lastInsertRowid } = db.prepare('INSERT INTO guests (name,phone) VALUES (?,?)').run(name.trim(), p);
    res.json(db.prepare('SELECT * FROM guests WHERE id=?').get(lastInsertRowid));
  } catch (e) {
    res.status(e.message.includes('UNIQUE') ? 409 : 500).json({ error: e.message });
  }
});

app.post('/api/guests/import', (req, res) => {
  const { guests } = req.body;
  if (!Array.isArray(guests)) return res.status(400).json({ error: 'guests must be an array' });
  const insert = db.prepare('INSERT OR IGNORE INTO guests (name,phone) VALUES (?,?)');
  let added = 0, skipped = 0;
  db.transaction((list) => {
    for (const g of list) {
      const p = normalizePhone(g.phone);
      if (!g.name || !p) { skipped++; continue; }
      insert.run(g.name.trim(), p).changes > 0 ? added++ : skipped++;
    }
  })(guests);
  res.json({ added, skipped });
});

app.put('/api/guests/:id', (req, res) => {
  const g = db.prepare('SELECT * FROM guests WHERE id=?').get(req.params.id);
  if (!g) return res.status(404).json({ error: 'Guest not found' });
  const { name, phone, rsvp_status, plus_ones, note } = req.body;
  const p = phone ? (normalizePhone(phone) ?? g.phone) : g.phone;
  db.prepare(`
    UPDATE guests SET name=?, phone=?, rsvp_status=?, plus_ones=?, note=?,
      responded_at = CASE WHEN rsvp_status != ? THEN datetime('now') ELSE responded_at END
    WHERE id=?
  `).run(name ?? g.name, p, rsvp_status ?? g.rsvp_status,
         plus_ones ?? g.plus_ones, note ?? g.note, g.rsvp_status, req.params.id);
  res.json(db.prepare('SELECT * FROM guests WHERE id=?').get(req.params.id));
});

app.delete('/api/guests/:id', (req, res) => {
  db.prepare('DELETE FROM guests WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Settings ──────────────────────────────────────────────────────────────────
app.get('/api/settings', (_req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

app.post('/api/settings', (req, res) => {
  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run(req.body.key, req.body.value);
  res.json({ success: true });
});

// ─── Party Details ─────────────────────────────────────────────────────────────
const PARTY_KEYS = ['party_title','party_hero_emoji','party_date','party_time',
                    'party_location','party_address','party_description','party_updates'];

app.get('/api/party', (_req, res) => {
  const rows = db.prepare(`SELECT * FROM settings WHERE key IN (${PARTY_KEYS.map(() => '?').join(',')})`).all(...PARTY_KEYS);
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

app.post('/api/party', (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)');
  db.transaction((data) => {
    for (const k of PARTY_KEYS) if (k in data) upsert.run(k, data[k] ?? '');
  })(req.body);
  res.json({ success: true });
});

function attendeeDisplayName(name) {
  const p = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'Guest';
  if (p.length === 1) return p[0];
  const last = p[p.length - 1];
  const ch = last[0];
  const initial = ch && /[a-z]/i.test(ch) ? `${ch.toUpperCase()}.` : '?';
  return `${p[0]} ${initial}`;
}

// Guest-only view: messages + who's coming, only after a valid invite phone is posted.
app.post('/api/party/guest-view', (req, res) => {
  const phone = normalizePhone(req.body.phone || '');
  if (!phone) return res.status(400).json({ error: 'Invalid phone number' });
  const found = db.prepare('SELECT id FROM guests WHERE phone=?').get(phone);
  if (!found) return res.status(404).json({ error: 'not_found' });

  const messageRows = db.prepare(`
    SELECT name, note, rsvp_status
    FROM guests
    WHERE TRIM(COALESCE(note, '')) != ''
      AND rsvp_status != 'pending'
    ORDER BY COALESCE(responded_at, '') DESC, id DESC
  `).all();

  const yesRows = db.prepare(`
    SELECT name, plus_ones FROM guests
    WHERE rsvp_status = 'yes'
    ORDER BY name ASC
  `).all();

  res.json({
    messages: messageRows.map((r) => ({
      firstName: String(r.name || '').trim().split(/\s+/)[0] || 'Guest',
      note: String(r.note || '').trim(),
      rsvp: r.rsvp_status,
    })),
    attendees: yesRows.map((r) => ({
      displayName: attendeeDisplayName(r.name),
      partyOf: 1 + (parseInt(r.plus_ones, 10) || 0),
    })),
  });
});

// ─── Stats ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', (_req, res) => {
  const total    = db.prepare('SELECT COUNT(*) c FROM guests').get().c;
  const yes      = db.prepare("SELECT COUNT(*) c, COALESCE(SUM(plus_ones+1),0) hc FROM guests WHERE rsvp_status='yes'").get();
  const no       = db.prepare("SELECT COUNT(*) c FROM guests WHERE rsvp_status='no'").get().c;
  const pending  = db.prepare("SELECT COUNT(*) c FROM guests WHERE rsvp_status='pending'").get().c;
  const invited  = db.prepare("SELECT COUNT(*) c FROM guests WHERE invited_at IS NOT NULL").get().c;
  res.json({ total, yes: yes.c, no, pending, invited, total_headcount: yes.hc });
});

// ─── Send Invites ──────────────────────────────────────────────────────────────
app.post('/api/send-invites', async (req, res) => {
  const { guest_ids, message_template } = req.body;
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.includes('xxx'))
    return res.status(400).json({ error: 'Twilio is not configured. Please set environment variables.' });

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const from   = process.env.TWILIO_PHONE_NUMBER;
  const tmpl   = message_template || db.prepare("SELECT value FROM settings WHERE key='invite_message'").get()?.value || '';

  const guests = guest_ids?.length
    ? db.prepare(`SELECT * FROM guests WHERE id IN (${guest_ids.map(() => '?').join(',')})`).all(...guest_ids)
    : db.prepare("SELECT * FROM guests WHERE invited_at IS NULL").all();

  const results = { sent: [], failed: [] };
  for (const g of guests) {
    const body = tmpl.replace(/{name}/gi, g.name.split(' ')[0]);
    try {
      await client.messages.create({ body, from, to: g.phone });
      db.prepare("UPDATE guests SET invited_at=datetime('now') WHERE id=?").run(g.id);
      results.sent.push({ id: g.id, name: g.name });
    } catch (err) {
      results.failed.push({ id: g.id, name: g.name, error: err.message });
    }
  }
  res.json(results);
});

// ─── Guest Web RSVP ────────────────────────────────────────────────────────────
app.post('/api/rsvp/lookup', (req, res) => {
  const phone = normalizePhone(req.body.phone || '');
  if (!phone) return res.status(400).json({ error: 'Invalid phone number' });
  const g = db.prepare('SELECT id,name,rsvp_status,plus_ones,note FROM guests WHERE phone=?').get(phone);
  if (!g) return res.status(404).json({ error: 'not_found' });
  res.json(g);
});

app.post('/api/rsvp/submit', (req, res) => {
  const { phone, rsvp_status, plus_ones, note } = req.body;
  const p = normalizePhone(phone || '');
  if (!p) return res.status(400).json({ error: 'Invalid phone number' });
  if (!['yes','no','maybe'].includes(rsvp_status)) return res.status(400).json({ error: 'Invalid status' });
  const g = db.prepare('SELECT * FROM guests WHERE phone=?').get(p);
  if (!g) return res.status(404).json({ error: 'not_found' });
  db.prepare("UPDATE guests SET rsvp_status=?,plus_ones=?,note=?,responded_at=datetime('now') WHERE id=?")
    .run(rsvp_status, parseInt(plus_ones)||0, note||'', g.id);
  res.json(db.prepare('SELECT id,name,rsvp_status,plus_ones,note FROM guests WHERE id=?').get(g.id));
});

// ─── Twilio Webhook ────────────────────────────────────────────────────────────
app.post('/webhook/sms', (req, res) => {
  const from  = req.body.From;
  const body  = (req.body.Body || '').trim().toLowerCase();
  const guest = db.prepare('SELECT * FROM guests WHERE phone=?').get(from);
  const twiml = new twilio.twiml.MessagingResponse();

  if (guest) {
    const name = guest.name.split(' ')[0];
    if (/^(yes|y|yeah|yep|attending|coming|absolutely|definitely|count me in)/.test(body)) {
      const num = body.match(/\b([2-9]|1[0-9])\b/);
      const plus = num ? parseInt(num[1]) - 1 : 0;
      db.prepare("UPDATE guests SET rsvp_status='yes',plus_ones=?,responded_at=datetime('now') WHERE id=?").run(plus, guest.id);
      twiml.message(plus > 0
        ? `🎉 Wonderful, ${name}! We've got you + ${plus}. Can't wait to celebrate!`
        : `🎉 Amazing, ${name}! You're on the list. To include a guest, reply YES 2.`);
    } else if (/^(no|n|nope|can't|cannot|won't|unable|not coming|sorry)/.test(body)) {
      db.prepare("UPDATE guests SET rsvp_status='no',responded_at=datetime('now') WHERE id=?").run(guest.id);
      twiml.message(`We'll miss you, ${name}! Thanks for letting us know. 💙`);
    } else if (/^(maybe|possibly|not sure|i'll try)/.test(body)) {
      db.prepare("UPDATE guests SET rsvp_status='maybe',responded_at=datetime('now') WHERE id=?").run(guest.id);
      twiml.message(`No worries, ${name}! Text YES or NO whenever you know 😊`);
    } else {
      twiml.message(`Hi ${name}! Reply YES or NO to let us know if you can make it 🎂`);
    }
  }

  res.type('text/xml').send(twiml.toString());
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
// Send index.html for any non-API route so React Router handles it client-side.
// Do not send HTML for /assets/* (Vite bundles): if static missed the file, return 404
// so the browser does not report a CSS MIME error from an HTML body.
app.get(/^(?!\/api|\/webhook).*/, (req, res) => {
  if (req.path.startsWith('/assets/')) {
    return res.status(404).type('text/plain').send('Asset not found');
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(500).type('text/plain').send('Client app not built. Run npm run build from the repo root.');
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎉 Server running at http://localhost:${PORT}`);
  console.log(`   Static SPA: ${clientDist}`);
  console.log(`   Twilio webhook → http://YOUR_DOMAIN/webhook/sms\n`);
});

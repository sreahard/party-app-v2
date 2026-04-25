# 🎂 Birthday Party RSVP — v2

React + Tailwind frontend, Express + SQLite backend.

## Project structure

```
├── package.json          # Root — dev/build scripts using concurrently
├── server/
│   ├── server.js         # Express API + Twilio webhook
│   ├── package.json
│   └── .env.example      # Copy to .env and fill in Twilio credentials
└── client/
    ├── vite.config.js    # Proxies /api → localhost:3000 in dev
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               # React Router setup
        ├── api.js                # All API calls in one place
        ├── context/ToastContext.jsx
        ├── components/           # Badge, StatCard, GuestModal, Countdown
        └── pages/
            ├── admin/            # Dashboard, Guests, Invite, Settings
            └── party/            # Public guest RSVP page
```

## Getting started

### 1. Install dependencies

```bash
# From the project root:
npm install                  # installs concurrently
npm --prefix server install  # installs Express, SQLite, Twilio
npm --prefix client install  # installs React, Vite, Tailwind
```

### 2. Configure Twilio

```bash
cp server/.env.example server/.env
# Edit server/.env with your Twilio credentials
```

### 3. Run in development

```bash
npm run dev
```

This starts both servers in parallel:
- **Express API** → http://localhost:3000
- **Vite dev server** → http://localhost:5173 (with API proxy)

Open http://localhost:5173 in your browser.

---

## Deploying to Railway

1. Push this repo to GitHub.
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub.
3. Set the **root directory** to `/` and the **start command** to:
   ```
   npm run build && npm start
   ```
   (`build` compiles the React app into `client/dist`; `start` runs Express which serves it.)
4. Add your environment variables in Railway's dashboard:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
5. Set your Twilio phone number's incoming webhook to:
   ```
   https://YOUR-RAILWAY-URL/webhook/sms
   ```

## Split deploy (client on GitHub Pages, server on Railway)

1. In Railway, deploy only the `server/` folder. Note its public URL.
2. Build the client with the server URL:
   ```bash
   VITE_API_URL=https://your-railway-url.up.railway.app npm run build
   ```
3. Push `client/dist` to a `gh-pages` branch.
4. In `server/.env`, set `CLIENT_ORIGIN=https://yourname.github.io` so CORS works.

---

## How guests RSVP

Guests can RSVP two ways — both update the same dashboard:

| Method | How it works |
|--------|-------------|
| **Text reply** | Reply YES / NO / MAYBE to the invite text. Say "YES 2" to include a +1. |
| **Website** | Visit `/party`, enter their phone number, pick their status. |

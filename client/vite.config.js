import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function isAdminPath(p) {
  return p === '/admin' || p.startsWith('/admin/')
}

function adminBasicAuthPlugin(mode) {
  const env = loadEnv(mode, path.join(__dirname, '..', 'server'), '')
  const user = env.ADMIN_BASIC_USER
  const pass = env.ADMIN_BASIC_PASSWORD

  return {
    name: 'admin-basic-auth',
    configureServer(server) {
      if (!user || !pass) return
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0] || ''
        if (!isAdminPath(pathname)) return next()

        const hdr = req.headers.authorization || ''
        const m = /^Basic\s+(.+)$/i.exec(hdr)
        if (!m) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Admin"')
          res.statusCode = 401
          res.end('Authentication required')
          return
        }
        let decoded
        try {
          decoded = Buffer.from(m[1], 'base64').toString('utf8')
        } catch {
          res.setHeader('WWW-Authenticate', 'Basic realm="Admin"')
          res.statusCode = 401
          res.end('Invalid credentials')
          return
        }
        const colon = decoded.indexOf(':')
        const u = colon === -1 ? decoded : decoded.slice(0, colon)
        const p = colon === -1 ? '' : decoded.slice(colon + 1)
        if (u === user && p === pass) return next()

        res.setHeader('WWW-Authenticate', 'Basic realm="Admin"')
        res.statusCode = 401
        res.end('Invalid credentials')
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [adminBasicAuthPlugin(mode), react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API and webhook calls to the Express server during development
      '/api':     { target: 'http://localhost:3000', changeOrigin: true },
      '/webhook': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
  },
}))

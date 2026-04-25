import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function isAdminPath(p) {
  return p === '/admin' || p.startsWith('/admin/')
}

/** Module + stylesheet requests use CORS mode when crossorigin is set; strip it for same-origin deploys. */
function stripCrossoriginFromHtml() {
  return {
    name: 'strip-html-crossorigin',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(=["'][^"']*["'])?/gi, '')
    },
  }
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
  plugins: [adminBasicAuthPlugin(mode), react(), stripCrossoriginFromHtml()],
  server: {
    port: 5173,
    proxy: {
      // Forward API and webhook calls to the Express server during development
      '/api':     { target: 'http://localhost:3000', changeOrigin: true },
      '/webhook': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  build: {
    // Output next to Express so production (e.g. Railway) always serves assets from the same tree as server.js.
    outDir: path.resolve(__dirname, '../server/public'),
    emptyOutDir: true,
    // Pin filenames under assets/ so index.html /assets/* always matches on-disk layout on any host.
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
}))

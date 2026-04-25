/**
 * Stop local dev listeners (Express + Vite, and Vite fallback port).
 * macOS/Linux: uses lsof + kill. No-op if nothing is bound.
 */
const { execSync } = require('child_process')

const ports = [3000, 5173, 5174]

for (const port of ports) {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' })
    const pids = out.trim().split(/\n/).filter(Boolean)
    for (const pid of pids) {
      try {
        execSync(`kill ${pid}`, { stdio: 'ignore' })
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* nothing on this port */
  }
}

console.log(`Stopped dev listeners on ports ${ports.join(', ')} (if any were running).`)

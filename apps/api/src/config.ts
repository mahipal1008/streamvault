function parseIntEnv(name: string, fallback: number): number {
  const v = process.env[name]
  if (!v) return fallback
  const n = parseInt(v, 10)
  if (Number.isNaN(n) || n <= 0) {
    process.stderr.write(`[config] invalid ${name}=${v}, falling back to ${fallback}\n`)
    return fallback
  }
  return n
}

const NODE_ENV = process.env.NODE_ENV ?? 'development'
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000'

if (NODE_ENV === 'production' && ALLOWED_ORIGIN === '*') {
  process.stderr.write(
    '[config] FATAL: ALLOWED_ORIGIN="*" is not permitted in production. Set it to your exact web origin.\n'
  )
  process.exit(1)
}

export const config = {
  PORT: parseIntEnv('PORT', 3001),
  NODE_ENV,
  ALLOWED_ORIGIN,
  PROXY_URL: process.env.PROXY_URL,
  API_KEY: process.env.API_KEY,

  // Operational limits
  MAX_DOWNLOAD_MS: parseIntEnv('MAX_DOWNLOAD_MS', 60 * 60 * 1000),
  MAX_STREAM_WAIT_MS: parseIntEnv('MAX_STREAM_WAIT_MS', 60 * 60 * 1000),
  JOB_TTL_MS: parseIntEnv('JOB_TTL_MS', 30 * 60 * 1000),
  RATE_LIMIT_MAX: parseIntEnv('RATE_LIMIT_MAX', 60),
  RATE_LIMIT_WINDOW_MS: parseIntEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  BODY_LIMIT_BYTES: parseIntEnv('BODY_LIMIT_BYTES', 64 * 1024),
}

export const isProd = NODE_ENV === 'production'

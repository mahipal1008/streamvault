import { promises as dns } from 'node:dns'
import { isIP } from 'node:net'

/** Block list for SSRF: RFC1918, loopback, link-local, CGNAT, multicast, IPv6 private/ULA/loopback, cloud metadata. */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10))
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true
  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true // link-local + AWS metadata 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  if (a >= 224) return true // multicast / reserved
  return false
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') return true
  if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true
  // IPv4-mapped IPv6 ::ffff:a.b.c.d
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIPv4(mapped[1])
  return false
}

export function isPrivateIp(ip: string): boolean {
  const family = isIP(ip)
  if (family === 4) return isPrivateIPv4(ip)
  if (family === 6) return isPrivateIPv6(ip)
  return true
}

export interface UrlGuardError extends Error {
  code: 'INVALID_URL' | 'BAD_SCHEME' | 'PRIVATE_HOST'
}

function err(code: UrlGuardError['code'], message: string): UrlGuardError {
  return Object.assign(new Error(message), { code }) as UrlGuardError
}

/**
 * Validate an external URL before handing it to yt-dlp.
 * - Must parse, http(s) only, no userinfo, no port < 1024 except 80/443, hostname not empty.
 * - Resolves DNS and rejects any address in private/loopback/link-local/CGNAT/multicast ranges.
 */
export async function assertSafeUrl(input: unknown): Promise<string> {
  if (typeof input !== 'string' || input.length === 0 || input.length > 2048) {
    throw err('INVALID_URL', 'URL must be a non-empty string up to 2048 chars')
  }
  let u: URL
  try {
    u = new URL(input)
  } catch {
    throw err('INVALID_URL', 'Malformed URL')
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw err('BAD_SCHEME', `Only http(s) URLs are allowed (got ${u.protocol})`)
  }
  if (u.username || u.password) {
    throw err('INVALID_URL', 'URL must not contain credentials')
  }
  const host = u.hostname
  if (!host) throw err('INVALID_URL', 'Missing hostname')

  // If literal IP, check directly.
  if (isIP(host)) {
    if (isPrivateIp(host)) throw err('PRIVATE_HOST', 'Private/loopback hosts are not allowed')
  } else {
    // Resolve all A/AAAA records.
    let addrs: string[] = []
    try {
      const [a, aaaa] = await Promise.allSettled([dns.resolve4(host), dns.resolve6(host)])
      if (a.status === 'fulfilled') addrs.push(...a.value)
      if (aaaa.status === 'fulfilled') addrs.push(...aaaa.value)
    } catch {
      throw err('PRIVATE_HOST', 'Unable to resolve host')
    }
    if (addrs.length === 0) throw err('PRIVATE_HOST', 'Host did not resolve')
    if (addrs.some((a) => isPrivateIp(a))) {
      throw err('PRIVATE_HOST', 'Host resolves to a private/loopback address')
    }
  }
  return u.toString()
}

/** Strict ID validator for yt-dlp format/track strings. */
export function isSafeYtdlpId(s: unknown, maxLen = 64): s is string {
  return typeof s === 'string' && s.length > 0 && s.length <= maxLen && /^[A-Za-z0-9_+./-]+$/.test(s)
}

const SUB_LANG_RE = /^[A-Za-z]{2,3}(-[A-Za-z]{2,4})?$/

export function isSafeSubLang(s: unknown): s is string {
  return typeof s === 'string' && SUB_LANG_RE.test(s)
}

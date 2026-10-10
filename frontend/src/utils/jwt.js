// utils/jwt.js
// -----------------------------------------------------------------------
// Client-side JSON Web Token (JWT) generator, validator, and decoder.
// Follows standard RFC 7519 structure: header.payload.signature (base64url)
// Demonstrates realistic token-based security for academic & portfolio defense.
// -----------------------------------------------------------------------

const JWT_SECRET = 'shelfshare_jwt_secret_token_2026_secure'

// Base64Url encoding / decoding
function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return decodeURIComponent(escape(atob(base64)))
}

// Simple pseudo-HMAC SHA-like signature for client-side demonstration
function pseudoSignature(headerB64, payloadB64, secret) {
  const input = `${headerB64}.${payloadB64}.${secret}`
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  const hex = hash.toString(16).padStart(8, '0')
  return base64UrlEncode(`sig_hs256_${hex}_shelfshare_signed`)
}

/**
 * Creates a valid JWT string
 * @param {object} payload - Claims to encode (e.g. sub, name, email, role)
 * @param {number} expiresInHours - Token validity in hours (default 24h)
 * @returns {string} - Complete JWT token in header.payload.signature format
 */
export function createJWT(payload, expiresInHours = 24) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iss: 'https://shelfshare.local',
    aud: 'https://shelfshare.local/api',
    iat: now,
    exp: now + expiresInHours * 3600,
  }

  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = pseudoSignature(headerEncoded, payloadEncoded, JWT_SECRET)

  return `${headerEncoded}.${payloadEncoded}.${signature}`
}

/**
 * Decodes a JWT token without verification
 * @param {string} token
 * @returns {{ header: object, payload: object, signature: string } | null}
 */
export function decodeJWT(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return { header, payload, signature: parts[2] }
  } catch (err) {
    console.error('Failed to decode JWT:', err)
    return null
  }
}

/**
 * Verifies a JWT token's signature and expiration
 * @param {string} token
 * @returns {{ valid: boolean, error?: string, payload?: object }}
 */
export function verifyJWT(token) {
  const decoded = decodeJWT(token)
  if (!decoded) return { valid: false, error: 'Malformed JWT format' }

  const parts = token.split('.')
  const expectedSig = pseudoSignature(parts[0], parts[1], JWT_SECRET)
  if (parts[2] !== expectedSig) {
    return { valid: false, error: 'Invalid token signature' }
  }

  const now = Math.floor(Date.now() / 1000)
  if (decoded.payload.exp && decoded.payload.exp < now) {
    return { valid: false, error: 'Token has expired', payload: decoded.payload }
  }

  return { valid: true, payload: decoded.payload }
}

export function isTokenExpired(token) {
  const res = verifyJWT(token)
  return !res.valid && res.error === 'Token has expired'
}

interface WindowEntry {
  count:   number
  resetAt: number
}

const windows = new Map<string, WindowEntry>()

export function rateLimitRequest(
  identifier: string,
  limit:      number,
  windowMs:   number
): { allowed: boolean; retryAfter: number } {
  const now   = Date.now()
  const entry = windows.get(identifier)

  if (!entry || now > entry.resetAt) {
    windows.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now()
  windows.forEach((entry, key) => { if (now > entry.resetAt) windows.delete(key) })
}, 5 * 60 * 1000)

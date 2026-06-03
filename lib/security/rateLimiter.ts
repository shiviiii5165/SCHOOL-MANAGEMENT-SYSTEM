interface RateLimitEntry {
  count:     number
  resetAt:   number
  blocked:   boolean
  blockedAt: number
}

const store = new Map<string, RateLimitEntry>()

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean
  remainingAttempts: number
  retryAfterSeconds: number
} {
  const now     = Date.now()
  const entry   = store.get(identifier)
  const LIMIT   = 5          // max attempts
  const WINDOW  = 15 * 60 * 1000   // 15 minute window
  const LOCKOUT = 30 * 60 * 1000   // 30 minute lockout after limit

  // Clean expired entries
  if (entry && now > entry.resetAt && !entry.blocked) {
    store.delete(identifier)
  }

  // Check if currently blocked
  if (entry?.blocked) {
    const unblockAt = entry.blockedAt + LOCKOUT
    if (now < unblockAt) {
      return {
        allowed:           false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.ceil((unblockAt - now) / 1000),
      }
    }
    store.delete(identifier)
  }

  const current = store.get(identifier) ?? { count: 0, resetAt: now + WINDOW, blocked: false, blockedAt: 0 }
  current.count++

  if (current.count >= LIMIT) {
    current.blocked   = true
    current.blockedAt = now
    store.set(identifier, current)
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: LOCKOUT / 1000 }
  }

  store.set(identifier, current)
  return {
    allowed:           true,
    remainingAttempts: LIMIT - current.count,
    retryAfterSeconds: 0,
  }
}

export function resetLoginAttempts(identifier: string) {
  store.delete(identifier)
}

// Clean up every hour to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt && !entry.blocked) store.delete(key)
    if (entry.blocked && now > entry.blockedAt + 30 * 60 * 1000) store.delete(key)
  })
}, 60 * 60 * 1000)

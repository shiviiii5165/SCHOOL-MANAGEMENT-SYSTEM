export function sanitizeMessage(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')  // strip HTML
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 2000)
}

export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Rate limiter (in-memory, resets per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
export function checkRateLimit(userId: string, limit = 60): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

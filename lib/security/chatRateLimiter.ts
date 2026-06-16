import { NextRequest } from 'next/server';

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Simple in-memory store for rate limiting (Note: Use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkChatRateLimit(req: NextRequest, userId: string) {
  const now = Date.now();
  const userRecord = requestCounts.get(userId);

  if (!userRecord) {
    requestCounts.set(userId, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }

  if (now > userRecord.resetTime) {
    // Reset window
    requestCounts.set(userId, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }

  if (userRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil((userRecord.resetTime - now) / 1000) };
  }

  userRecord.count += 1;
  return { allowed: true };
}

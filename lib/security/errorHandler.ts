import { NextResponse } from 'next/server'

export function handleApiError(error: unknown, context: string) {
  // Log full error server-side
  console.error(`[API Error] ${context}:`, error)

  // Return safe generic message to client
  // NEVER expose: stack traces, DB errors, internal paths, Prisma codes

  if (error instanceof Error) {
    // Only expose safe, user-facing messages
    const SAFE_MESSAGES = [
      'Invalid credentials',
      'Too many attempts',
      'Account is disabled',
      'Unauthorized',
      'Forbidden',
      'Not found',
      'Validation failed',
      'Rate limit exceeded',
    ]

    const isSafe = SAFE_MESSAGES.some(m => error.message.includes(m))
    if (isSafe) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  // Generic error for everything else
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  )
}

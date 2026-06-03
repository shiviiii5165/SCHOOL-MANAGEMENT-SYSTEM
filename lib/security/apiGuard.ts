import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      session: null,
      error:   NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    return {
      session: null,
      error:   NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return { session, error: null }
}

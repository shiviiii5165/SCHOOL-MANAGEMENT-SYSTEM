import os

base = r'd:\school-management-system\school-management-system\lib\security'
os.makedirs(base, exist_ok=True)

files = {
    'rateLimiter.ts': '''interface RateLimitEntry {
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
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt && !entry.blocked) store.delete(key)
    if (entry.blocked && now > entry.blockedAt + 30 * 60 * 1000) store.delete(key)
  }
}, 60 * 60 * 1000)
''',
    'apiGuard.ts': '''import { auth } from '@/lib/auth'
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
''',
    'ownershipGuard.ts': '''import { prisma } from '@/lib/prisma'

export async function canAccessStudent(
  requestingUserId: string,
  requestingRole:   string,
  targetStudentId:  string
): Promise<boolean> {
  // Admin and teachers can access any student
  if (requestingRole === 'ADMIN' || requestingRole === 'TEACHER') return true

  // Student can only access themselves
  if (requestingRole === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { id: targetStudentId },
      select: { userId: true }
    })
    return student?.userId === requestingUserId
  }

  // Parent can only access their linked children
  if (requestingRole === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where:   { userId: requestingUserId },
      include: { children: { select: { id: true } } }
    })
    return parent?.children.some(c => c.id === targetStudentId) ?? false
  }

  return false
}
''',
    'schemas.ts': '''import { z } from 'zod'

// Reusable
export const cuidSchema   = z.string().cuid()
export const emailSchema  = z.string().email().max(255).toLowerCase()
export const nameSchema   = z.string().min(2).max(100).trim()
export const textSchema   = z.string().max(2000).trim()
export const percentSchema = z.number().min(0).max(100)

// Login
export const LoginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(6).max(100),
})

// Attendance
export const AttendanceSubmitSchema = z.object({
  classId:    cuidSchema,
  date:       z.string().datetime(),
  headCount:  z.number().int().min(0).max(200).optional(),
  records:    z.array(z.object({
    studentId: cuidSchema,
    status:    z.enum(['PRESENT', 'ABSENT', 'LATE', 'BLOCKED']),
  })).min(1).max(150),
})

// Discipline
export const DisciplineReportSchema = z.object({
  studentId:   cuidSchema,
  category:    z.enum(['MOBILE_USE_IN_CLASS','CHEATING','FIGHTING',
                       'IMPROPER_BEHAVIOUR','ABUSIVE_LANGUAGE',
                       'BUNKING','VANDALISM','BULLYING','OTHER']),
  description: z.string().min(10).max(1000).trim(),
  evidenceUrl: z.string().url().optional().nullable(),
})

// Discipline action
export const DisciplineActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('DISMISS') }),
  z.object({ action: z.literal('WARNING'), warningNote: z.string().min(5).max(500) }),
  z.object({
    action:         z.literal('SUSPENSION'),
    suspendedFrom:  z.string().datetime(),
    suspendedUntil: z.string().datetime(),
    reason:         z.string().min(5).max(500),
  }),
])

// Fee payment
export const FeePaymentSchema = z.object({
  feeRecordId: cuidSchema,
  amount:      z.number().positive().max(1000000),
  paymentMode: z.enum(['ONLINE','CASH','CHEQUE','UPI']),
})

// Message
export const MessageSchema = z.object({
  body: z.string().min(1).max(2000).trim(),
})

// Create conversation
export const ConversationSchema = z.object({
  type:           z.enum(['DIRECT','GROUP','ANNOUNCEMENT']),
  participantIds: z.array(cuidSchema).min(1).max(500),
  name:           z.string().max(100).optional(),
  classId:        cuidSchema.optional(),
})

// Exam
export const CreateExamSchema = z.object({
  name:           z.string().min(2).max(200),
  type:           z.enum(['UNIT_TEST_1','UNIT_TEST_2','MID_TERM',
                          'PRE_BOARD','FINAL','PRACTICAL']),
  academicYear:   z.string().regex(/^\d{4}-\d{2,4}$/),
  startDate:      z.string().datetime(),
  endDate:        z.string().datetime(),
  defaultPassPct: z.number().min(0).max(100),
  classIds:       z.array(cuidSchema).min(1),
})

// Marks entry
export const MarksEntrySchema = z.object({
  entries: z.array(z.object({
    studentId: cuidSchema,
    marks:     z.number().min(0).max(999).nullable(),
    isAbsent:  z.boolean(),
  })).min(1).max(150),
  isFinal: z.boolean(),
})

// Notice
export const NoticeSchema = z.object({
  title:    z.string().min(5).max(300).trim(),
  content:  z.string().min(10).max(5000).trim(),
  audience: z.array(z.string()).min(1),
  isPinned: z.boolean().optional(),
})

// Validate and parse helper:
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): 
  { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const msg = result.error.errors.map(e => f"{e.path.join('.')}: {e.message}").join(', ')
    return { data: null as any, error: msg }
  }
  return { data: result.data, error: null }
}
''',
    'errorHandler.ts': '''import { NextResponse } from 'next/server'

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
''',
    'globalRateLimit.ts': '''interface WindowEntry {
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
  for (const [key, entry] of windows.entries()) {
    if (now > entry.resetAt) windows.delete(key)
  }
}, 5 * 60 * 1000)
''',
    'fileValidator.ts': '''const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOC_TYPES   = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE       = 5 * 1024 * 1024  // 5MB

export function validateFileUpload(file: File, type: 'image' | 'document'): 
  { valid: true } | { valid: false; error: string } {
  
  const allowed = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES
  
  if (!allowed.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowed.join(', ')}` }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum 5MB allowed.' }
  }
  
  // Check file name (prevent path traversal)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  if (safeName !== file.name) {
    return { valid: false, error: 'Invalid characters in filename.' }
  }
  
  return { valid: true }
}
''',
    'botDetection.ts': '''import { NextRequest } from 'next/server'

// Known bot/scanner signatures
const BOT_USER_AGENTS = [
  /sqlmap/i, /nikto/i, /nessus/i, /masscan/i, /zgrab/i,
  /dirbuster/i, /gobuster/i, /hydra/i, /medusa/i, /burpsuite/i,
  /metasploit/i, /w3af/i, /skipfish/i, /nmap/i, /acunetix/i,
]

// Suspicious request patterns
const ATTACK_PATTERNS = [
  /union.+select/i,           // SQL injection
  /exec\s*\(/i,               // Code execution
  /<script/i,                 // XSS
  /javascript:/i,             // XSS
  /on\w+\s*=/i,               // Event handler injection
  /\.\.\//,                   // Path traversal
  /%2e%2e%2f/i,               // Encoded path traversal
  /etc\/passwd/i,             // Linux file access
  /cmd\.exe/i,                // Windows command execution
]

export function detectAttack(req: NextRequest): { attack: boolean; reason: string } {
  const ua  = req.headers.get('user-agent') ?? ''
  const url = decodeURIComponent(req.nextUrl.toString())

  // Check user agent
  if (BOT_USER_AGENTS.some(p => p.test(ua))) {
    return { attack: true, reason: 'Suspicious user agent' }
  }

  // Check URL patterns
  for (const pattern of ATTACK_PATTERNS) {
    if (pattern.test(url)) {
      return { attack: true, reason: 'Attack pattern detected in URL' }
    }
  }

  // Check request body patterns (for POST requests - check content-type header size)
  const contentLength = parseInt(req.headers.get('content-length') ?? '0')
  if (contentLength > 10 * 1024 * 1024) {  // 10MB request body limit
    return { attack: true, reason: 'Request body too large' }
  }

  return { attack: false, reason: '' }
}
''',
    'env.ts': '''// Validate all required env vars on startup
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate NEXTAUTH_SECRET strength
  const secret = process.env.NEXTAUTH_SECRET!
  if (secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters')
  }

  // Validate DATABASE_URL has SSL in production
  if (process.env.NODE_ENV === 'production') {
    const dbUrl = process.env.DATABASE_URL!
    if (!dbUrl.includes('sslmode=require') && !dbUrl.includes('ssl=true')) {
      console.warn('⚠️ DATABASE_URL should include SSL parameters in production')
    }
  }
}
'''
}

for name, content in files.items():
    with open(os.path.join(base, name), 'w', encoding='utf-8') as f:
        f.write(content)

print("Created 9 security files.")

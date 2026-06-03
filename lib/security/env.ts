// Validate all required env vars on startup
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

import { NextRequest } from 'next/server'

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

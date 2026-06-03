const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
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

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

interface PermissionCheckInput {
  senderRole: Role
  recipientRoles: Role[]
  type: 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT'
}

export function canStartConversation(input: PermissionCheckInput): boolean {
  const { senderRole, recipientRoles, type } = input

  if (type === 'ANNOUNCEMENT') return senderRole === 'ADMIN'

  if (type === 'GROUP') {
    // Only TEACHER and ADMIN can create groups
    return senderRole === 'ADMIN' || senderRole === 'TEACHER'
  }

  // DIRECT conversation rules:
  const rules: Record<Role, Role[]> = {
    STUDENT:  ['TEACHER', 'ADMIN'],
    TEACHER:  ['STUDENT', 'TEACHER', 'ADMIN'],
    PARENT:   ['TEACHER', 'ADMIN'],
    ADMIN:    ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN'],
  }

  return recipientRoles.every(r => rules[senderRole].includes(r))
}

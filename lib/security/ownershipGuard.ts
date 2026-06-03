import { prisma } from '@/lib/prisma'

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
      include: { students: { select: { id: true } } }
    })
    return parent?.students.some((c: any) => c.id === targetStudentId) ?? false
  }

  return false
}

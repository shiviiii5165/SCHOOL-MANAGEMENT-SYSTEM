import { z } from 'zod'

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
const baseFineFields = {
  imposeFine:   z.boolean().optional(),
  fineAmount:   z.number().positive().max(50000).optional(),
  fineReason:   z.string().min(5).max(500).optional(),
  fineDueDate:  z.string().datetime().optional(),
}

export const DisciplineActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('DISMISS') }),
  z.object({ action: z.literal('WARNING'), warningNote: z.string().min(5).max(500), ...baseFineFields }),
  z.object({ action: z.literal('FINE_ONLY'), ...baseFineFields }),
  z.object({
    action:         z.literal('SUSPENSION'),
    suspendedFrom:  z.string().datetime(),
    suspendedUntil: z.string().datetime(),
    reason:         z.string().min(5).max(500),
    ...baseFineFields
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

// Student Management
export const StudentSchema = z.object({
  name: nameSchema,
  rollNo: z.string().min(1).max(50).trim(),
  classId: cuidSchema,
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.enum(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']).optional().nullable(),
  parentName: nameSchema,
  parentPhone: z.string().regex(/^\d{10}$/, 'Must be a 10-digit number'),
  address: textSchema.optional(),
  hasTransport: z.boolean(),
  transportZone: z.enum(['A', 'B', 'C', 'D']).optional().nullable(),
})

export const EditStudentSchema = StudentSchema.omit({ rollNo: true, classId: true })

// Validate and parse helper:
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): 
  { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const msg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    return { data: null as any, error: msg }
  }
  return { data: result.data, error: null }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/security/apiGuard'
import { EditStudentSchema, validate } from '@/lib/security/schemas'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { session, error: authError } = await requireAuth()
    if (authError) return authError
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await req.json()
    const { data, error: valError } = validate(EditStudentSchema, body)
    if (valError) return NextResponse.json({ error: `Validation failed: ${valError}` }, { status: 400 })

    const { 
      name, dateOfBirth, gender, bloodGroup, 
      parentName, parentPhone, address, hasTransport, transportZone 
    } = data!

    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true, parent: { include: { user: true } } }
    })
    
    if (!existingStudent) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Student Profile
      const updatedStudent = await tx.student.update({
        where: { id: params.id },
        data: {
          dateOfBirth: new Date(dateOfBirth),
          gender,
          bloodGroup,
          fatherName: parentName,
          fatherPhone: parentPhone,
          address,
          hasTransport,
          transportZone: hasTransport ? transportZone : null,
        }
      })

      // 2. Update Student User name
      await tx.user.update({
        where: { id: existingStudent.userId },
        data: { name }
      })

      // 3. Update Parent Info
      if (existingStudent.parentId && existingStudent.parent) {
        await tx.user.update({
          where: { id: existingStudent.parent.userId },
          data: { name: parentName, phone: parentPhone }
        })
      }

      // 4. Handle Transport Fee changes
      if (!existingStudent.hasTransport && hasTransport) {
        // Transport newly enabled, generate future transport invoices for current year
        const currentYear = new Date().getFullYear()
        const quarters = [
          { date: new Date(currentYear, 3, 10), name: "Q1 Fee (Apr-Jun)" },
          { date: new Date(currentYear, 6, 10), name: "Q2 Fee (Jul-Sep)" },
          { date: new Date(currentYear, 9, 10), name: "Q3 Fee (Oct-Dec)" },
          { date: new Date(currentYear + 1, 0, 10), name: "Q4 Fee (Jan-Mar)" }
        ]
        const now = new Date()
        const feeData = []
        for (const q of quarters) {
          if (q.date > now) {
            feeData.push({
              studentId: params.id,
              amount: 5000,
              feeType: "Transport",
              dueDate: q.date,
              status: "UNPAID"
            })
          }
        }
        if (feeData.length > 0) {
          await tx.feeRecord.createMany({ data: feeData })
        }
      } else if (existingStudent.hasTransport && !hasTransport) {
        // Transport disabled, cancel unpaid transport invoices
        await tx.feeRecord.deleteMany({
          where: {
            studentId: params.id,
            feeType: "Transport",
            status: "UNPAID"
          }
        })
      }

      return updatedStudent
    }, {
      maxWait: 5000,
      timeout: 20000 // Increase timeout to 20 seconds to prevent P2028 on remote DBs
    })

    return NextResponse.json({ success: true, student: result })
  } catch (error) {
    console.error('Edit Student Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { session, error: authError } = await requireAuth()
    if (authError) return authError
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id }
    })
    
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      // 1. Soft delete student (mark suspended/inactive)
      await tx.student.update({
        where: { id: params.id },
        data: { isSuspended: true, suspendedReason: 'DEACTIVATED_BY_ADMIN' }
      })

      // 2. Disable user login
      await tx.user.update({
        where: { id: student.userId },
        data: { isActive: false }
      })

      // 3. Remove from active message groups
      await tx.messageParticipant.deleteMany({
        where: { userId: student.userId }
      })
    })

    return NextResponse.json({ success: true, message: 'Student deactivated successfully' })
  } catch (error) {
    console.error('Delete Student Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

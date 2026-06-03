import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/security/apiGuard'
import { StudentSchema, validate } from '@/lib/security/schemas'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { session, error: authError } = await requireAuth()
    if (authError) return authError
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied. Admins only.' }, { status: 403 })
    }

    const body = await req.json()
    const { data, error: valError } = validate(StudentSchema, body)
    if (valError) return NextResponse.json({ error: `Validation failed: ${valError}` }, { status: 400 })

    const { 
      name, rollNo, classId, dateOfBirth, gender, bloodGroup, 
      parentName, parentPhone, address, hasTransport, transportZone 
    } = data!

    // Check if rollNo already exists in this class
    const existingStudent = await prisma.student.findFirst({
      where: { classId, rollNo }
    })
    if (existingStudent) {
      return NextResponse.json({ error: 'Roll number already taken in this class' }, { status: 400 })
    }

    const cls = await prisma.class.findUnique({ where: { id: classId } })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    // Generate Reg ID
    const year = new Date().getFullYear()
    const latestStudent = await prisma.user.findFirst({
      where: { regId: { startsWith: `STU-${year}-` } },
      orderBy: { createdAt: 'desc' }
    })
    let seq = 1
    if (latestStudent && latestStudent.regId) {
      const parts = latestStudent.regId.split('-')
      if (parts.length === 3) seq = parseInt(parts[2], 10) + 1
    }
    const regId = `STU-${year}-${seq.toString().padStart(3, '0')}`

    const studentEmail = `${rollNo.toLowerCase()}@student.dpsrajasthan.edu.in`
    const parentEmail = `parent.${rollNo.toLowerCase()}@parent.dpsrajasthan.edu.in`
    
    // Check emails
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: [studentEmail, parentEmail] } }
    })
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Generated emails already exist (likely duplicate roll number globally)' }, { status: 400 })
    }

    const studentPasswordPlain = 'Student@1234'
    const parentPasswordPlain = 'Parent@1234'
    const studentPasswordHashed = await bcrypt.hash(studentPasswordPlain, 10)
    const parentPasswordHashed = await bcrypt.hash(parentPasswordPlain, 10)

    // Using transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Student User
      const studentUser = await tx.user.create({
        data: {
          regId: regId, // STU-YYYY-XXX
          name: name,
          email: studentEmail,
          password: studentPasswordHashed,
          role: 'STUDENT',
          phone: parentPhone // backup
        }
      })

      // 2. Create Parent User
      const parentUser = await tx.user.create({
        data: {
          regId: `PAR-${regId}`, // Unique regId for parent based on system regId
          name: parentName,
          email: parentEmail,
          password: parentPasswordHashed,
          role: 'PARENT',
          phone: parentPhone
        }
      })

      // 3. Create Parent Profile
      const parentProfile = await tx.parent.create({
        data: { userId: parentUser.id }
      })

      // 4. Create Student Profile
      const studentProfile = await tx.student.create({
        data: {
          userId: studentUser.id,
          rollNo: rollNo,
          classId: classId,
          dateOfBirth: new Date(dateOfBirth),
          admissionDate: new Date(),
          gender: gender,
          bloodGroup: bloodGroup,
          fatherName: parentName,
          motherName: "", // Fill defaults
          fatherPhone: parentPhone,
          motherPhone: "",
          address: address || "",
          parentId: parentProfile.id,
          hasTransport: hasTransport,
          transportZone: hasTransport ? transportZone : null,
          attendancePercentage: 0
        }
      })

      // 5. Create Attendance Summary
      await tx.attendanceSummary.create({
        data: {
          studentId: studentProfile.id,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          totalClasses: 0,
          attendancePercentage: 0
        }
      })

      // 6. Generate Fee Invoices (Placeholder for 4 Quarters)
      const currentYear = new Date().getFullYear()
      const quarters = [
        { date: new Date(currentYear, 3, 10), name: "Q1 Fee (Apr-Jun)" },
        { date: new Date(currentYear, 6, 10), name: "Q2 Fee (Jul-Sep)" },
        { date: new Date(currentYear, 9, 10), name: "Q3 Fee (Oct-Dec)" },
        { date: new Date(currentYear + 1, 0, 10), name: "Q4 Fee (Jan-Mar)" }
      ]

      const feeData = []
      for (const q of quarters) {
        feeData.push({
          studentId: studentProfile.id,
          amount: 15000, // Combined tuition, library, sports, etc placeholder
          feeType: "Tuition",
          dueDate: q.date,
          status: "UNPAID"
        })
        if (hasTransport) {
          feeData.push({
            studentId: studentProfile.id,
            amount: 5000, // Transport fee placeholder
            feeType: "Transport",
            dueDate: q.date,
            status: "UNPAID"
          })
        }
      }

      if (feeData.length > 0) {
        await tx.feeRecord.createMany({
          data: feeData
        })
      }

      // 7. Add to Class Messaging Group (if it exists)
      const classGroup = await tx.messageConversation.findFirst({
        where: { type: 'GROUP', classId: classId }
      })
      if (classGroup) {
        await tx.messageParticipant.create({
          data: {
            conversationId: classGroup.id,
            userId: studentUser.id,
            role: 'MEMBER'
          }
        })
      }

      return { studentProfile, studentUser, parentUser, regId }
    }, {
      maxWait: 5000,
      timeout: 20000 // Increase timeout to 20 seconds to prevent P2028 on remote DBs
    })

    return NextResponse.json({
      success: true,
      message: 'Student added successfully',
      student: result.studentProfile,
      credentials: {
        student: {
          email: studentEmail,
          password: studentPasswordPlain,
          regId: regId
        },
        parent: {
          email: parentEmail,
          password: parentPasswordPlain
        },
        systemRegId: regId
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Add Student Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error while creating student' }, { status: 500 })
  }
}

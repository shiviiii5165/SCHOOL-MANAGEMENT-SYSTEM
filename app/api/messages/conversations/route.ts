import { NextResponse, NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { canStartConversation } from '@/lib/messages/permissions'
import { requireAuth } from '@/lib/security/apiGuard'
import { handleApiError } from '@/lib/security/errorHandler'
import { validate, ConversationSchema } from '@/lib/security/schemas'

// GET — list all conversations for current user
export async function GET() {
  try {
    const { session, error: authError } = await requireAuth()
    if (authError) return authError

    const userId = session.user.id

    const participants = await prisma.messageParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { id:true, name:true, role:true, avatar:true } } },
              take: 10,
            },
            messages: {
              where:   { isDeleted: false },
              orderBy: { createdAt: 'desc' },
              take:    1,
              include: { sender: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    })

    const onlineUsers: Map<string, Set<string>> = (global as any)._onlineUsers ?? new Map()

    const conversations = participants.map(p => {
      const conv       = p.conversation
      const lastMsg    = conv.messages[0]
      const unread     = conv.messages.filter(m =>
        !p.lastReadAt || m.createdAt > p.lastReadAt
      ).length

      return {
        id:           conv.id,
        type:         conv.type,
        name:         conv.name,
        classId:      (conv as any).classId,
        updatedAt:    conv.updatedAt,
        participants: conv.participants.map(pt => ({
          ...pt.user,
          isOnline: onlineUsers.has(pt.user.id),
        })),
        lastMessage: lastMsg ? {
          body:      lastMsg.isDeleted ? null : lastMsg.body.slice(0, 60),
          senderId:  lastMsg.senderId,
          senderName:lastMsg.sender.name,
          createdAt: lastMsg.createdAt,
        } : null,
        unreadCount: unread,
      }
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    return handleApiError(error, 'messages/conversations')
  }
}

// POST — create conversation
export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuth()
    if (authError) return authError

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

    const { data, error: valError } = validate(ConversationSchema, body);
    if (valError) return NextResponse.json({ error: `Validation failed: ${valError}` }, { status: 400 });

    const { type, participantIds, name, classId } = data!
    const myId   = session.user.id
    const myRole = session.user.role as string

    // Permission check
    const recipientUsers = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { role: true },
    })
    const recipientRoles = recipientUsers.map(u => u.role as any)

    const allowed = canStartConversation({ senderRole: myRole as any, recipientRoles, type })
    if (!allowed) return NextResponse.json({ error: 'Permission denied' }, { status: 403 })

    // Deduplication for DIRECT
    if (type === 'DIRECT' && participantIds.length === 1) {
      const otherId = participantIds[0]
      const existing = await prisma.messageConversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: myId } } },
            { participants: { some: { userId: otherId } } },
          ],
        },
        include: { participants: { include: { user: { select: { id:true, name:true, role:true, avatar:true } } } } }
      })
      if (existing) return NextResponse.json({ conversation: existing }, { status: 200 })
    }

    // Build participant list
    let allParticipantIds = Array.from(new Set([myId, ...participantIds]))

    // CLASS GROUP: add all students of class
    if (type === 'GROUP' && classId) {
      const students = await prisma.student.findMany({
        where:  { classId },
        select: { userId: true },
      })
      const cls = await prisma.class.findUnique({
        where: { id: classId },
        select: { name: true, section: true },
      })
      allParticipantIds = Array.from(new Set([...allParticipantIds, ...students.map(s => s.userId)]))
      const convName = name ?? `${cls?.name}-${cls?.section}`

      // Dedup class group
      const existing = await prisma.messageConversation.findFirst({
        where: { type: 'GROUP', classId }
      })
      if (existing) return NextResponse.json({ conversation: existing }, { status: 200 })

      const conv = await prisma.messageConversation.create({
        data: {
          type, name: convName, classId, createdById: myId,
          participants: {
            create: allParticipantIds.map(uid => ({
              userId: uid,
              role: uid === myId ? 'ADMIN' : 'MEMBER',
            }))
          }
        },
        include: { participants: { include: { user: { select: { id:true, name:true, role:true, avatar:true } } } } }
      })

      const io = (global as any)._io
      if (io) allParticipantIds.forEach(uid =>
        io.to(`user:${uid}`).emit('conv:new', conv)
      )
      return NextResponse.json({ conversation: conv }, { status: 201 })
    }

    // TEACHER LOUNGE dedup
    if (type === 'GROUP' && name === 'Teacher Lounge') {
      const existing = await prisma.messageConversation.findFirst({
        where: { type: 'GROUP', name: 'Teacher Lounge' }
      })
      if (existing) return NextResponse.json({ conversation: existing }, { status: 200 })

      const teachers = await prisma.user.findMany({
        where: { role: { in: ['TEACHER', 'ADMIN'] } },
        select: { id: true }
      })
      allParticipantIds = teachers.map(t => t.id)
    }

    // ANNOUNCEMENT: all users
    if (type === 'ANNOUNCEMENT') {
      const all = await prisma.user.findMany({ select: { id: true } })
      allParticipantIds = all.map(u => u.id)
    }

    const conv = await prisma.messageConversation.create({
      data: {
        type, name, classId: classId ?? null, createdById: myId,
        participants: {
          create: allParticipantIds.map(uid => ({
            userId: uid,
            role: uid === myId ? 'ADMIN' : 'MEMBER',
          }))
        }
      },
      include: { participants: { include: { user: { select: { id:true, name:true, role:true, avatar:true } } } } }
    })

    const io = (global as any)._io
    if (io) allParticipantIds.forEach(uid =>
      io.to(`user:${uid}`).emit('conv:new', conv)
    )
    return NextResponse.json({ conversation: conv }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'messages/conversations')
  }
}

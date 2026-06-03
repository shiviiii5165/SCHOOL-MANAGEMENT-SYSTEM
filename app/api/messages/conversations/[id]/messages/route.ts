import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeMessage, checkRateLimit } from '@/lib/messages/utils'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 30))
  const skip  = (page - 1) * limit

  // Verify participant
  const participant = await prisma.messageParticipant.findUnique({
    where: { conversationId_userId: { conversationId: params.id, userId: session.user.id } }
  })
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where:   { conversationId: params.id },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
      include: { sender: { select: { id:true, name:true, role:true, avatar:true } } },
    }),
    prisma.message.count({ where: { conversationId: params.id } }),
  ])

  // Mark as read (fire-and-forget)
  prisma.messageParticipant.updateMany({
    where: { conversationId: params.id, userId: session.user.id },
    data:  { lastReadAt: new Date() },
  }).catch(() => {})

  return NextResponse.json({
    messages: messages.reverse(),
    hasMore:  total > skip + limit,
    total,
  })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit
  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: 'Too many messages' }, { status: 429 })
  }

  const participant = await prisma.messageParticipant.findUnique({
    where: { conversationId_userId: { conversationId: params.id, userId: session.user.id } }
  })
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { body } = await req.json()
  const clean = sanitizeMessage(body ?? '')
  if (!clean) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: params.id, senderId: session.user.id, body: clean },
      include: { sender: { select: { id:true, name:true, role:true, avatar:true } } },
    }),
    prisma.messageConversation.update({
      where: { id: params.id },
      data:  { updatedAt: new Date() },
    }),
  ])

  const io = (global as any)._io
  if (io) io.to(`conv:${params.id}`).emit('msg:new', message)

  return NextResponse.json({ message }, { status: 201 })
}

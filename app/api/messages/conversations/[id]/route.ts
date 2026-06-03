import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const participant = await prisma.messageParticipant.findUnique({
    where: { conversationId_userId: { conversationId: params.id, userId: session.user.id } }
  })
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const conv = await prisma.messageConversation.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, role: true, avatar: true } } }
      }
    }
  })
  
  if (!conv) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

  const onlineUsers = (global as any)._onlineUsers as Map<string, Set<string>> ?? new Map()

  const formatted = {
    ...conv,
    participants: conv.participants.map(pt => ({
      ...pt.user,
      isOnline: onlineUsers.has(pt.user.id)
    }))
  }

  return NextResponse.json({ conversation: formatted })
}

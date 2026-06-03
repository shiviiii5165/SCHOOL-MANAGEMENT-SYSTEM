import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ count: 0 })

  const participants = await prisma.messageParticipant.findMany({
    where: { userId: session.user.id },
    include: {
      conversation: {
        include: {
          messages: {
            where:   { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take:    1,
          }
        }
      }
    }
  })

  let totalUnread = 0
  for (const p of participants) {
    const lastMsg = p.conversation.messages[0]
    if (lastMsg && (!p.lastReadAt || lastMsg.createdAt > p.lastReadAt)) {
      totalUnread++
    }
  }

  return NextResponse.json({ count: totalUnread })
}

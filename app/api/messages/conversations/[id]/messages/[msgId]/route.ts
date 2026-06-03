import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; msgId: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const message = await prisma.message.findUnique({ where: { id: params.msgId } })
  if (!message || message.senderId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ageMs = Date.now() - message.createdAt.getTime()
  if (ageMs > 5 * 60 * 1000) {
    return NextResponse.json({ error: 'Delete window expired (5 min)' }, { status: 403 })
  }

  await prisma.message.update({
    where: { id: params.msgId },
    data:  { isDeleted: true, deletedAt: new Date() },
  })

  const io = (global as any)._io
  if (io) io.to(`conv:${params.id}`)
    .emit('msg:deleted', { messageId: params.msgId, conversationId: params.id })

  return NextResponse.json({ success: true })
}

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createNotifications } from '@/lib/notifications'

export async function GET(req: Request) {
  // Verify cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Find all students whose suspension has expired
  const expired = await prisma.student.findMany({
    where: { isSuspended: true, suspendedUntil: { lte: now } },
    include: { user: true, parent: { include: { user: true } } }
  })

  for (const student of expired) {
    await prisma.student.update({
      where: { id: student.id },
      data:  { isSuspended: false, suspendedUntil: null, suspendedFrom: null, suspendedReason: null }
    })

    await createNotifications([
      { userId: student.userId, title: '✅ Suspension Lifted', message: 'Your suspension period has ended. Your attendance access has been fully restored. Welcome back!', type: 'DISCIPLINE', link: '/student' },
      { userId: student.parent?.userId, title: '✅ Suspension Period Ended', message: `${student.user.name}'s suspension has ended and attendance access has been restored.`, type: 'DISCIPLINE', link: '/parent' },
    ])

    // io.to(`user:${student.userId}`).emit('notification:new')
    // io.to(`user:${student.parent?.userId}`).emit('notification:new')
  }

  return NextResponse.json({ lifted: expired.length })
}

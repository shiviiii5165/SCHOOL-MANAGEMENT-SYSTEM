import { prisma } from './prisma'
import { NotificationType } from '@prisma/client'

export interface NotifPayload {
  userId?:   string | null
  title:     string
  message:   string
  type:      NotificationType
  link?:     string
  metadata?: object
}

export async function createNotifications(notifications: NotifPayload[]) {
  const valid = notifications.filter(n => !!n.userId)
  if (valid.length === 0) return
  await prisma.notification.createMany({
    data: valid.map(n => ({
      userId:   n.userId!,
      title:    n.title,
      message:  n.message,
      type:     n.type,
      link:     n.link ?? null,
      metadata: n.metadata ?? {},
    })),
    skipDuplicates: false,
  })
}

'use client'
import { useMessageStore } from '@/stores/messageStore'
export function useUnreadCount() {
  return useMessageStore(s => s.totalUnread)
}

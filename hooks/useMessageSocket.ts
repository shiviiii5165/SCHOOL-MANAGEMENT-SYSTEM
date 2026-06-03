'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { useMessageStore } from '@/stores/messageStore'

let socketSingleton: Socket | null = null

export function useMessageSocket() {
  const { data: session } = useSession()
  const store = useMessageStore()
  const retries = useRef(0)

  useEffect(() => {
    if (!session?.user?.id) return

    if (!socketSingleton) {
      socketSingleton = io({ path: '/socket.io', transports: ['websocket', 'polling'] })
    }

    const socket = socketSingleton

    socket.on('connect', () => {
      retries.current = 0
      store.setConnected(true)
      // Auth socket with server
      socket.emit('msg:auth', {
        userId:          session.user.id,
        conversationIds: store.conversations.map(c => c.id),
      })
    })

    socket.on('disconnect', () => { store.setConnected(false) })

    socket.on('msg:new',         (msg)  => store.onNewMessage(msg))
    socket.on('msg:deleted',     (data) => store.onMessageDeleted(data.messageId, data.conversationId))
    socket.on('conv:new',        (conv) => store.onNewConversation(conv))
    socket.on('user:status',     (data) => {
      data.isOnline ? store.setUserOnline(data.userId) : store.setUserOffline(data.userId)
    })
    socket.on('msg:typing',      (data) => store.setTyping(data.conversationId, data.userId, data.isTyping))
    socket.on('msg:read:update', () => {})

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('msg:new')
      socket.off('msg:deleted')
      socket.off('conv:new')
      socket.off('user:status')
      socket.off('msg:typing')
      socket.off('msg:read:update')
    }
  }, [session?.user?.id])

  const sendTyping = (convId: string, isTyping: boolean) => {
    socketSingleton?.volatile.emit(
      isTyping ? 'msg:typing:start' : 'msg:typing:stop',
      { conversationId: convId }
    )
  }

  const markRead = (convId: string) => {
    socketSingleton?.emit('msg:read', { conversationId: convId })
  }

  const joinConv = (convId: string) => {
    socketSingleton?.emit('msg:join:conv', { conversationId: convId })
  }

  return { isConnected: store.isConnected, sendTyping, markRead, joinConv }
}

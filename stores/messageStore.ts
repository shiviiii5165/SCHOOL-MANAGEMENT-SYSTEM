import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface Conversation {
  id: string; type: string; name: string | null; classId: string | null
  updatedAt: string; participants: any[]; lastMessage: any; unreadCount: number
}

export interface Message {
  id: string; conversationId: string; senderId: string; body: string
  isDeleted: boolean; createdAt: string; sender: any
  status?: 'sending' | 'sent' | 'error'
  tempId?: string
}

interface MessageStore {
  conversations:       Conversation[]
  activeConvId:        string | null
  messages:            Record<string, Message[]>
  onlineUsers:         Set<string>
  typingUsers:         Record<string, string[]>
  totalUnread:         number
  isConnected:         boolean

  setConversations:    (c: Conversation[]) => void
  setActiveConv:       (id: string | null) => void
  addOptimistic:       (convId: string, msg: Message) => void
  confirmMessage:      (tempId: string, realMsg: Message) => void
  revertMessage:       (tempId: string) => void
  onNewMessage:        (msg: Message) => void
  onMessageDeleted:    (msgId: string, convId: string) => void
  onNewConversation:   (conv: Conversation) => void
  setMessages:         (convId: string, msgs: Message[], hasMore: boolean) => void
  prependMessages:     (convId: string, msgs: Message[]) => void
  setUserOnline:       (userId: string) => void
  setUserOffline:      (userId: string) => void
  setTyping:           (convId: string, userId: string, isTyping: boolean) => void
  markRead:            (convId: string) => void
  setConnected:        (v: boolean) => void
  hasMoreMessages:     Record<string, boolean>
}

export const useMessageStore = create<MessageStore>()(
  immer((set, get) => ({
    conversations: [], activeConvId: null, messages: {},
    onlineUsers: new Set(), typingUsers: {}, totalUnread: 0,
    isConnected: false, hasMoreMessages: {},

    setConversations: (convs) => set(s => {
      s.conversations = convs
      s.totalUnread   = convs.reduce((sum, c: Conversation) => sum + (c.unreadCount ?? 0), 0)
    }),

    setActiveConv: (id) => set(s => { s.activeConvId = id }),

    addOptimistic: (convId, msg) => set(s => {
      if (!s.messages[convId]) s.messages[convId] = []
      s.messages[convId].push(msg)
      const conv = s.conversations.find((c: Conversation) => c.id === convId)
      if (conv) {
        conv.updatedAt   = msg.createdAt
        conv.lastMessage = { body: msg.body, senderId: msg.senderId, createdAt: msg.createdAt }
      }
      // Move to top
      s.conversations = [
        ...(s.conversations.filter((c: Conversation) => c.id === convId)),
        ...(s.conversations.filter((c: Conversation) => c.id !== convId)),
      ]
    }),

    confirmMessage: (tempId, realMsg) => set(s => {
      const msgs = s.messages[realMsg.conversationId]
      if (!msgs) return
      const idx = msgs.findIndex((m: Message) => m.tempId === tempId)
      if (idx !== -1) msgs[idx] = realMsg
    }),

    revertMessage: (tempId) => set(s => {
      for (const convId of Object.keys(s.messages)) {
        s.messages[convId] = s.messages[convId].filter((m: Message) => m.tempId !== tempId)
      }
    }),

    onNewMessage: (msg) => set(s => {
      if (!s.messages[msg.conversationId]) s.messages[msg.conversationId] = []
      const exists = s.messages[msg.conversationId].some((m: Message) => m.id === msg.id)
      if (!exists) s.messages[msg.conversationId].push(msg)

      const conv = s.conversations.find((c: Conversation) => c.id === msg.conversationId)
      if (conv) {
        conv.lastMessage = { body: msg.body, senderId: msg.senderId, createdAt: msg.createdAt }
        conv.updatedAt   = msg.createdAt
        if (s.activeConvId !== msg.conversationId) {
          conv.unreadCount = (conv.unreadCount ?? 0) + 1
          s.totalUnread++
        }
      }
      s.conversations = [
        ...(s.conversations.filter((c: Conversation) => c.id === msg.conversationId)),
        ...(s.conversations.filter((c: Conversation) => c.id !== msg.conversationId)),
      ]
    }),

    onMessageDeleted: (msgId, convId) => set(s => {
      const msgs = s.messages[convId]
      if (!msgs) return
      const msg = msgs.find((m: Message) => m.id === msgId)
      if (msg) msg.isDeleted = true
    }),

    onNewConversation: (conv) => set(s => {
      if (!s.conversations.some((c: Conversation) => c.id === conv.id)) {
        s.conversations.unshift(conv)
      }
    }),

    setMessages: (convId, msgs, hasMore) => set(s => {
      s.messages[convId]     = msgs
      s.hasMoreMessages[convId] = hasMore
    }),

    prependMessages: (convId, msgs) => set(s => {
      s.messages[convId] = [...msgs, ...(s.messages[convId] ?? [])]
    }),

    setUserOnline:  (uid) => set(s => { s.onlineUsers.add(uid) }),
    setUserOffline: (uid) => set(s => { s.onlineUsers.delete(uid) }),

    setTyping: (convId, userId, isTyping) => set(s => {
      if (!s.typingUsers[convId]) s.typingUsers[convId] = []
      if (isTyping) {
        if (!s.typingUsers[convId].includes(userId))
          s.typingUsers[convId].push(userId)
      } else {
        s.typingUsers[convId] = s.typingUsers[convId].filter((u: string) => u !== userId)
      }
    }),

    markRead: (convId) => set(s => {
      const conv = s.conversations.find((c: Conversation) => c.id === convId)
      if (conv) {
        s.totalUnread = Math.max(0, s.totalUnread - (conv.unreadCount ?? 0))
        conv.unreadCount = 0
      }
    }),

    setConnected: (v) => set(s => { s.isConnected = v }),
  }))
)

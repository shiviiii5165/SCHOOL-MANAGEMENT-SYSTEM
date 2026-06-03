import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMessageStore } from '@/stores/messageStore'
import { useMessageSocket } from '@/hooks/useMessageSocket'
import { generateTempId } from '@/lib/messages/utils'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'

export function ChatWindow({ onBack }: { onBack: () => void }) {
  const { data: session } = useSession()
  const myId = session?.user?.id
  const activeConvId = useMessageStore(s => s.activeConvId)
  const conversation = useMessageStore(s => s.conversations.find(c => c.id === activeConvId))
  const messages = useMessageStore(s => activeConvId ? (s.messages[activeConvId] || []) : [])
  const typingUsers = useMessageStore(s => activeConvId ? (s.typingUsers[activeConvId] || []) : [])
  const { markRead, joinConv } = useMessageSocket()
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeConvId || !myId) return
    
    // Join room
    joinConv(activeConvId)
    // Mark read locally & on server
    useMessageStore.getState().markRead(activeConvId)
    markRead(activeConvId)

    let isSubscribed = true
    const loadMessages = () => {
      const msgs = useMessageStore.getState().messages[activeConvId]
      if (!msgs || msgs.length === 0) setLoading(true)
      
      const limit = msgs && msgs.length > 30 ? msgs.length + 10 : 30
      
      fetch(`/api/messages/conversations/${activeConvId}/messages?limit=${limit}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (isSubscribed && data.messages) {
            const currentMsgs = useMessageStore.getState().messages[activeConvId] || []
            // Preserve optimistic messages that haven't been confirmed in the DB yet
            const optimistics = currentMsgs.filter(m => 
              m.tempId && m.status === 'sending' && !data.messages.some((dm: any) => dm.body === m.body && dm.senderId === m.senderId)
            )
            const merged = [...optimistics, ...data.messages]
            useMessageStore.getState().setMessages(activeConvId, merged, data.hasMore)
          }
        })
        .finally(() => { if (isSubscribed) setLoading(false) })
    }

    loadMessages()
    const interval = setInterval(loadMessages, 3000)

    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [activeConvId, myId])

  if (!activeConvId || !conversation || !myId) return null

  const handleSend = async (body: string) => {
    const tempId = generateTempId()
    const optimisticMsg: any = {
      id: tempId, tempId, conversationId: activeConvId,
      senderId: myId, body, isDeleted: false,
      createdAt: new Date().toISOString(),
      sender: { id: myId, name: session.user.name, role: session.user.role },
      status: 'sending'
    }
    useMessageStore.getState().addOptimistic(activeConvId, optimisticMsg)

    try {
      const res = await fetch(`/api/messages/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
      })
      if (!res.ok) throw new Error('Failed to send')
      const data = await res.json()
      useMessageStore.getState().confirmMessage(tempId, data.message)
    } catch (e) {
      optimisticMsg.status = 'error'
      useMessageStore.getState().confirmMessage(tempId, optimisticMsg as any)
    }
  }

  const handleDelete = async (msgId: string) => {
    if (!confirm('Delete this message?')) return
    useMessageStore.getState().onMessageDeleted(msgId, activeConvId)
    await fetch(`/api/messages/conversations/${activeConvId}/messages/${msgId}`, { method: 'DELETE' })
  }

  const typingNames = typingUsers
    .filter(uid => uid !== myId)
    .map(uid => conversation.participants.find((p: any) => p.id === uid)?.name)
    .filter(Boolean) as string[]

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <ChatHeader 
        conversation={conversation} 
        onBack={() => {
          useMessageStore.getState().setActiveConv(null)
          onBack()
        }}
        currentUserId={myId}
      />
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <MessageList 
          messages={messages} 
          currentUserId={myId} 
          onDeleteMessage={handleDelete} 
        />
      )}

      {typingNames.length > 0 && (
        <div className="px-6 -mb-2">
          <TypingIndicator users={typingNames} />
        </div>
      )}

      <MessageInput convId={activeConvId} onSend={handleSend} />
    </div>
  )
}

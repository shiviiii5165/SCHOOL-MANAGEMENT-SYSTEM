import { useEffect, useRef } from 'react'
import { Message } from '@/stores/messageStore'
import { MessageBubble } from './MessageBubble'
import { DateSeparator } from './DateSeparator'
import { format, isSameDay } from 'date-fns'

interface Props {
  messages: Message[]
  currentUserId: string
  onDeleteMessage: (msgId: string) => void
}

export function MessageList({ messages, currentUserId, onDeleteMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isNearBottom = () => {
    const el = containerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150
  }

  useEffect(() => {
    if (isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  let lastDate: Date | null = null

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar"
    >
      {messages.map((msg, i) => {
        const date = new Date(msg.createdAt)
        const showDate = !lastDate || !isSameDay(lastDate, date)
        if (showDate) lastDate = date
        
        const isOwn = msg.senderId === currentUserId
        // 5 min window
        const canDelete = isOwn && (Date.now() - date.getTime() < 5 * 60 * 1000)

        return (
          <div key={msg.tempId || msg.id}>
            {showDate && <DateSeparator date={format(date, 'MMMM d, yyyy')} />}
            <MessageBubble 
              message={msg} 
              isOwn={isOwn} 
              onDelete={onDeleteMessage}
              canDelete={canDelete}
            />
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

import { Conversation } from '@/stores/messageStore'
import { Users, UserCircle2 } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

interface Props {
  conversation: Conversation
  currentUserId: string
  isActive: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, currentUserId, isActive, onClick }: Props) {
  const isGroup = conversation.type === 'GROUP' || conversation.type === 'ANNOUNCEMENT'
  
  let title = conversation.name
  let isOnline = false
  let avatar = null

  if (!isGroup) {
    let other = conversation.participants.find((p: any) => p.id !== currentUserId)
    if (!other && conversation.participants.length > 0) other = conversation.participants[0]
    
    if (other) {
      title = other.name || 'Unknown User'
      isOnline = other.isOnline
      avatar = other.avatar
    }
  }

  const timeLabel = () => {
    if (!conversation.updatedAt) return ''
    const date = new Date(conversation.updatedAt)
    if (isToday(date)) return format(date, 'h:mm a')
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM d')
  }

  const unreadCount = conversation.unreadCount || 0
  const lastMsg = conversation.lastMessage

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3.5 transition-all text-left mx-2 my-1 rounded-xl
        ${isActive 
          ? 'bg-white shadow-sm ring-1 ring-black/5' 
          : 'hover:bg-white/50 text-slate-600'
        }
      `}
    >
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt={title || ''} className="w-12 h-12 rounded-full object-cover bg-slate-100 shadow-sm ring-2 ring-white" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-500 shadow-sm ring-2 ring-white">
            {isGroup ? <Users className="w-6 h-6" /> : <UserCircle2 className="w-7 h-7" />}
          </div>
        )}
        {!isGroup && isOnline && (
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`font-semibold truncate text-[15px] ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
            {title}
          </span>
          <span className={`text-[11px] whitespace-nowrap ml-2 ${unreadCount > 0 ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
            {timeLabel()}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] truncate ${unreadCount > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
            {lastMsg ? (
              lastMsg.body ? (
                <>
                  <span className="opacity-70">{lastMsg.senderId === currentUserId ? 'You: ' : ''}</span>
                  {lastMsg.body}
                </>
              ) : (
                <span className="italic text-slate-400">Message deleted</span>
              )
            ) : (
              <span className="italic text-slate-400">Start a conversation...</span>
            )}
          </span>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] px-1.5 flex-shrink-0 shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

import { Conversation } from '@/stores/messageStore'
import { ArrowLeft, Users, UserCircle2, Info } from 'lucide-react'

interface Props {
  conversation: Conversation
  onBack: () => void
  currentUserId: string
}

export function ChatHeader({ conversation, onBack, currentUserId }: Props) {
  const isGroup = conversation.type === 'GROUP' || conversation.type === 'ANNOUNCEMENT'
  
  let title = conversation.name
  let subtitle = isGroup ? `${conversation.participants.length} members` : ''
  let isOnline = false
  let avatar = null

  if (!isGroup) {
    let other = conversation.participants.find((p: any) => p.id !== currentUserId)
    if (!other && conversation.participants.length > 0) other = conversation.participants[0]

    if (other) {
      title = other.name || 'Unknown User'
      subtitle = other.role
      isOnline = other.isOnline
      avatar = other.avatar
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full md:hidden transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>

        <div className="relative">
          {avatar ? (
            <img src={avatar} alt={title || ''} className="w-11 h-11 rounded-full object-cover bg-slate-100 shadow-sm ring-2 ring-white" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-indigo-500 shadow-sm ring-2 ring-white">
              {isGroup ? <Users className="w-5 h-5" /> : <UserCircle2 className="w-6 h-6" />}
            </div>
          )}
          {!isGroup && isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
          )}
        </div>

        <div className="flex flex-col">
          <h2 className="font-bold text-slate-800 text-[16px] leading-tight">{title}</h2>
          <span className="text-[12px] text-slate-500 capitalize font-medium">{subtitle?.toLowerCase()}</span>
        </div>
      </div>
      
      <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
        <Info className="w-5 h-5" />
      </button>
    </div>
  )
}

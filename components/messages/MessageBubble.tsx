import { motion } from 'framer-motion'
import { Message } from '@/stores/messageStore'
import { format } from 'date-fns'

const roleColors: Record<string, string> = {
  ADMIN: 'text-blue-600',
  TEACHER: 'text-violet-600',
  STUDENT: 'text-teal-600',
  PARENT: 'text-amber-600',
}

interface Props {
  message: Message
  isOwn: boolean
  onDelete?: (msgId: string) => void
  canDelete?: boolean
}

export function MessageBubble({ message, isOwn, onDelete, canDelete }: Props) {
  const time = format(new Date(message.createdAt), 'h:mm a')
  
  if (message.isDeleted) {
    return (
      <div className={`flex w-full mb-6 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="bg-slate-50/50 border border-slate-200/60 italic text-slate-400 px-5 py-2.5 rounded-2xl rounded-br-sm text-[13px] shadow-sm">
          This message was deleted
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex w-full mb-6 group ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {!isOwn && message.sender && (
          <span className={`text-[11px] mb-1.5 ml-1.5 font-semibold tracking-wide uppercase ${roleColors[message.sender.role] || 'text-slate-400'}`}>
            {message.sender.name}
          </span>
        )}
        
        <div className="flex items-end gap-2">
          {isOwn && canDelete && (
            <button 
              onClick={() => onDelete?.(message.id)}
              className="text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg -mb-1"
              title="Delete message"
            >
              Delete
            </button>
          )}
          
          <div className={`
            px-5 py-3 text-[15px] leading-relaxed break-words shadow-sm relative
            ${isOwn 
              ? 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white rounded-2xl rounded-br-sm shadow-indigo-200 border border-indigo-500/20' 
              : 'bg-white text-slate-800 rounded-2xl rounded-bl-sm border border-slate-100 shadow-slate-100'
            }
          `}>
            {message.body}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 mt-1.5 mx-1.5 text-[10px] font-medium text-slate-400">
          <span>{time}</span>
          {message.status === 'sending' && <span className="animate-pulse text-indigo-400">• sending</span>}
          {message.status === 'error' && <span className="text-red-500">• failed</span>}
        </div>
      </div>
    </motion.div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { SendHorizontal, Paperclip, SmilePlus } from 'lucide-react'
import { useMessageSocket } from '@/hooks/useMessageSocket'

interface Props {
  convId: string
  onSend: (body: string) => void
  disabled?: boolean
}

export function MessageInput({ convId, onSend, disabled }: Props) {
  const [body, setBody] = useState('')
  const { sendTyping } = useMessageSocket()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    setBody(el.value)
    if (el.value.length > 0) {
      sendTyping(convId, true)
    } else {
      sendTyping(convId, false)
    }
  }

  const submit = () => {
    const clean = body.trim()
    if (!clean || disabled) return
    onSend(clean)
    setBody('')
    sendTyping(convId, false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  return (
    <div className="p-2 md:p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-4xl mx-auto flex items-end gap-1 md:gap-2 bg-slate-50/80 rounded-3xl p-1 md:p-1.5 border border-slate-200/60 shadow-sm focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
        
        <button className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors mb-0.5">
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleInput}
          placeholder="Type your message..."
          className="flex-1 max-h-[120px] min-h-[44px] resize-none bg-transparent py-3 px-2 focus:outline-none text-[15px] text-slate-700 placeholder:text-slate-400 custom-scrollbar"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          disabled={disabled}
        />

        <button className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors mb-0.5">
          <SmilePlus className="w-5 h-5" />
        </button>

        <button
          onClick={submit}
          disabled={!body.trim() || disabled}
          className="p-3 mb-0.5 mr-0.5 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white rounded-full hover:shadow-md hover:shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:shadow-none transition-all"
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

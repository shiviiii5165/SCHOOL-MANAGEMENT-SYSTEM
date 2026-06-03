'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, MessageSquare } from 'lucide-react'
import { useMessageStore } from '@/stores/messageStore'
import { useMessageSocket } from '@/hooks/useMessageSocket'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { EmptyState } from './EmptyState'
import { NewConversationModal } from './NewConversationModal'

export function MessagesLayout() {
  const { data: session } = useSession()
  const myId = session?.user?.id
  const { isConnected } = useMessageSocket()
  
  const activeConvId = useMessageStore(s => s.activeConvId)
  const setConversations = useMessageStore(s => s.setConversations)
  
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!myId) return
    let isSubscribed = true
    const loadConvs = () => {
      fetch('/api/messages/conversations', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (isSubscribed && data.conversations) {
            setConversations(data.conversations)
          }
        })
        .finally(() => { if (isSubscribed) setLoading(false) })
    }

    loadConvs()
    const interval = setInterval(loadConvs, 3000)

    return () => {
      isSubscribed = false
      clearInterval(interval)
    }
  }, [myId])

  if (!myId) return null

  return (
    <div className="h-full w-full flex bg-slate-50/50 md:mt-4 md:rounded-2xl md:border md:border-slate-200/60 shadow-none md:shadow-sm overflow-hidden relative">

      {/* LEFT PANEL */}
      <div className={`w-full md:w-[340px] flex-shrink-0 bg-slate-50/50 border-r border-slate-200/60 flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-200/60 flex items-center justify-between bg-white/50 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-200">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight">Chats</h1>
          </div>
          <button 
            onClick={() => setModalOpen(true)}
            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 active:scale-95 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 bg-gradient-to-b from-white/30 to-transparent">
          <ConversationList currentUserId={myId} loading={loading} />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={`flex-1 flex-col bg-white relative ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
        {activeConvId ? (
          <ChatWindow onBack={() => {}} />
        ) : (
          <EmptyState onNew={() => setModalOpen(true)} />
        )}
      </div>

      <NewConversationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

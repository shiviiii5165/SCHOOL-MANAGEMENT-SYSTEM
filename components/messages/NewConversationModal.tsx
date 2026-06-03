import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { ContactSection } from './ContactSection'
import { useMessageStore } from '@/stores/messageStore'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function NewConversationModal({ isOpen, onClose }: Props) {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const setActiveConv = useMessageStore(s => s.setActiveConv)
  const router = useRouter()

  const loadContacts = useCallback(async () => {
    setLoading(true)
    setFetchError(null)

    // Retry up to 3 times with delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch('/api/messages/contacts', { cache: 'no-store' })
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error(`[Contacts] Attempt ${attempt} failed (${res.status}):`, errorText)
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt))
            continue
          }
          setFetchError(`Server error (${res.status}). Please try again.`)
          setLoading(false)
          return
        }

        const data = await res.json()
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections)
          setFetchError(null)
          setLoading(false)
          return
        } else {
          console.warn(`[Contacts] Attempt ${attempt}: Empty sections returned`)
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt))
            continue
          }
          setSections([])
          setLoading(false)
          return
        }
      } catch (err: any) {
        console.error(`[Contacts] Attempt ${attempt} exception:`, err)
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000 * attempt))
          continue
        }
        setFetchError('Network error. Check your connection and try again.')
        setLoading(false)
        return
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadContacts()
    } else {
      // Reset state when modal closes
      setSections([])
      setSearch('')
      setFetchError(null)
    }
  }, [isOpen, loadContacts])

  const filteredSections = sections.map(sec => ({
    ...sec,
    items: (sec.items || []).filter((item: any) => 
      item?.name?.toLowerCase().includes(search.toLowerCase()) || 
      (item?.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase()))
    )
  })).filter(sec => sec.items.length > 0)

  const handleSelect = async (contact: any) => {
    try {
      setCreating(true)
      let payload: any = { type: 'DIRECT', participantIds: [contact.id] }
      
      if (contact.role === 'BROADCAST') {
        payload = { type: 'ANNOUNCEMENT', participantIds: [], name: contact.name }
      } else if (contact.role === 'GROUP') {
        payload = { type: 'GROUP', participantIds: [], name: contact.name }
        if (contact.classId) payload.classId = contact.classId
      }

      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (res.ok && data.conversation) {
        useMessageStore.getState().onNewConversation(data.conversation)
        setActiveConv(data.conversation.id)
        onClose()
      } else {
        alert(data.error || 'Failed to start conversation.')
      }
    } catch (e) {
      console.error(e)
      alert('Network error while starting conversation.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-text-primary text-lg">New Message</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-border bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search contacts..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {loading || creating ? (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : fetchError ? (
                <div className="p-8 text-center flex flex-col items-center gap-3">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="text-gray-600 text-sm">{fetchError}</p>
                  <button 
                    onClick={loadContacts}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : filteredSections.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {search ? `No contacts matching "${search}".` : 'No contacts found.'}
                </div>
              ) : (
                filteredSections.map(sec => (
                  <ContactSection key={sec.id} section={sec} onSelect={handleSelect} />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

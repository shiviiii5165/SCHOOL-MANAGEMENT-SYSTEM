import { useMessageStore } from '@/stores/messageStore'
import { ConversationItem } from './ConversationItem'
import { SkeletonConvItem } from './SkeletonConvItem'

interface Props {
  currentUserId: string
  loading: boolean
}

export function ConversationList({ currentUserId, loading }: Props) {
  const conversations = useMessageStore(s => s.conversations)
  const activeConvId = useMessageStore(s => s.activeConvId)
  const setActiveConv = useMessageStore(s => s.setActiveConv)

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {[1, 2, 3, 4, 5].map(i => <SkeletonConvItem key={i} />)}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-text-secondary text-sm">
        No conversations yet. Start a new one!
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {conversations.map(conv => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          currentUserId={currentUserId}
          isActive={activeConvId === conv.id}
          onClick={() => setActiveConv(conv.id)}
        />
      ))}
    </div>
  )
}

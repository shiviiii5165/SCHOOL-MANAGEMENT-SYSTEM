import { UserCircle2, Users } from 'lucide-react'

interface Props {
  contact: any
  onClick: () => void
}

export function ContactItem({ contact, onClick }: Props) {
  const isGroup = contact.role === 'GROUP' || contact.role === 'BROADCAST'
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="relative flex-shrink-0">
        {contact.avatar ? (
          <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            {isGroup ? <Users className="w-5 h-5" /> : <UserCircle2 className="w-6 h-6" />}
          </div>
        )}
        {!isGroup && contact.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
        )}
      </div>
      
      <div className="flex-col min-w-0 flex-1 flex">
        <span className="text-sm font-medium text-text-primary truncate">{contact.name}</span>
        {contact.subtitle && (
          <span className="text-xs text-text-secondary truncate">{contact.subtitle}</span>
        )}
      </div>
    </button>
  )
}

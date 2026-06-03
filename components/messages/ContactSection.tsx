import { ContactItem } from './ContactItem'

interface Props {
  section: any
  onSelect: (contact: any) => void
}

export function ContactSection({ section, onSelect }: Props) {
  if (!section.items || section.items.length === 0) return null

  return (
    <div className="mb-4">
      <div className="px-4 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
        {section.label}
      </div>
      <div className="mt-1">
        {section.items.map((item: any) => (
          <ContactItem 
            key={item.id} 
            contact={item} 
            onClick={() => onSelect(item)} 
          />
        ))}
      </div>
    </div>
  )
}

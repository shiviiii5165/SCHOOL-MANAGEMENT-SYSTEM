import { LucideIcon, FileText } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-surface border border-border border-dashed rounded-xl h-full min-h-[300px]">
      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-display font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-md font-medium transition-colors text-sm shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

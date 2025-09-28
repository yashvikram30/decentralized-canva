import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  className = ''
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`space-y-4 my-3 ${className}`}>
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 retro-button hover:bg-[var(--retro-accent)] transition-colors"
      >
        <h3 className="text-sm font-bold text-[var(--retro-text)] uppercase tracking-wide text-center flex-1">
          {title}
        </h3>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--retro-text)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--retro-text)]" />
        )}
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="space-y-4 px-2 py-3">
          {children}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

interface RetroTabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  tabs: { value: string; label: string; content: React.ReactNode }[];
  className?: string;
}

export default function RetroTabs({ 
  defaultValue, 
  value, 
  onValueChange, 
  tabs,
  className 
}: RetroTabsProps) {
  const [activeTab, setActiveTab] = useState(value || defaultValue);

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    onValueChange?.(tabValue);
  };

  return (
    <div className={className}>
      <div className="grid w-full grid-cols-2 border-2 border-[var(--retro-border)] rounded-md overflow-hidden">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === tab.value
                ? 'bg-[var(--retro-accent)] text-[var(--retro-text)]'
                : 'bg-[var(--retro-bg)] text-[var(--retro-text)] hover:bg-[var(--retro-accent)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.map((tab) => (
          activeTab === tab.value && (
            <div key={tab.value}>
              {tab.content}
            </div>
          )
        ))}
      </div>
    </div>
  );
}

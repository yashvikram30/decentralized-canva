import React from 'react';

interface RetroSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export default function RetroSwitch({ 
  checked, 
  onCheckedChange, 
  label,
  className 
}: RetroSwitchProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-[var(--retro-accent)]' : 'bg-[var(--retro-bg)]'
        } border-2 border-[var(--retro-border)]`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-[var(--retro-text)] transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && (
        <label className="text-sm font-bold text-[var(--retro-text)]">
          {label}
        </label>
      )}
    </div>
  );
}

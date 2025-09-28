import React from 'react';

interface RetroSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function RetroSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder = "Select an option",
  className,
  label 
}: RetroSelectProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-bold text-[var(--retro-text)] mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border-2 border-[var(--retro-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--retro-accent)] bg-[var(--retro-bg)] text-[var(--retro-text)]"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

import React from 'react';

interface RetroModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function RetroModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  className 
}: RetroModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      <div className={`retro-panel relative z-10 max-w-md w-full mx-4 ${className}`}>
        {title && (
          <div className="p-4 border-b-2 border-[var(--retro-border)]">
            <h2 className="text-lg font-bold text-[var(--retro-text)]">{title}</h2>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t-2 border-[var(--retro-border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

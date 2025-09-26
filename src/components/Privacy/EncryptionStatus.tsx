'use client';

import React, { useState } from 'react';
import { Lock, Unlock, Users, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

type EncryptionStatusType = 'public' | 'private' | 'team' | 'template';

interface EncryptionStatusProps {
  status?: EncryptionStatusType;
  onToggle?: (newStatus: EncryptionStatusType) => void;
  isProcessing?: boolean;
  className?: string;
}

export default function EncryptionStatus({ 
  status = 'public',
  onToggle,
  isProcessing = false,
  className 
}: EncryptionStatusProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const statusConfig = {
    public: {
      icon: Unlock,
      label: 'Public Design',
      description: 'No encryption',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    private: {
      icon: Lock,
      label: 'Private & Encrypted',
      description: 'Mock encrypted',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    team: {
      icon: Users,
      label: 'Team Access',
      description: 'Shared encrypted',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    template: {
      icon: Globe,
      label: 'Public Template',
      description: 'Intentionally public',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  };

  const currentConfig = statusConfig[status];
  const Icon = currentConfig.icon;

  const handleToggle = () => {
    if (isProcessing || !onToggle) return;
    
    setIsAnimating(true);
    
    // Simulate processing time
    setTimeout(() => {
      const newStatus = status === 'public' ? 'private' : 'public';
      onToggle(newStatus);
      setIsAnimating(false);
    }, 1500);
  };

  if (isProcessing || isAnimating) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200",
        className
      )}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">
          {status === 'public' ? '🔐 Encrypting design...' : '⚠️ Design will be publicly accessible'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Status Indicator */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full border",
        currentConfig.bgColor,
        currentConfig.color,
        currentConfig.borderColor
      )}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{currentConfig.label}</span>
      </div>

      {/* Toggle Button */}
      {onToggle && (
        <button
          onClick={handleToggle}
          disabled={isProcessing || isAnimating}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-lg transition-colors",
            status === 'public'
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-700 hover:bg-green-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {status === 'public' ? 'Make Private' : 'Make Public'}
        </button>
      )}
    </div>
  );
}

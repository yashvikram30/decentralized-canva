'use client';

import React from 'react';
import { cn } from '@/utils/helpers';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  width?: number;
}

export default function Sidebar({ 
  children, 
  className,
  width = 256 
}: SidebarProps) {
  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-full",
        className
      )}
      style={{ width: `${width}px` }}
    >
      {children}
    </aside>
  );
}

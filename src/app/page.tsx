'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import CanvasEditor to avoid SSR issues with Fabric.js
const CanvasEditor = dynamic(() => import('@/components/Canvas/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center retro-panel p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--retro-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--retro-text)] font-bold">Loading WalrusCanvas AI...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <CanvasEditor />
    </div>
  );
}

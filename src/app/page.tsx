'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import CanvasEditor to avoid SSR issues with Fabric.js
const CanvasEditor = dynamic(() => import('@/components/Canvas/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading WalrusCanvas AI...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CanvasEditor />
    </div>
  );
}

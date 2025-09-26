'use client';

import React, { useState } from 'react';
import { Shield, Save, Download, Share2, Settings } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useWallet } from '@/contexts/WalletContext';
import WalletStatus from '@/components/Wallet/WalletStatus';
import WalletModal from '@/components/Wallet/WalletModal';

interface HeaderProps {
  isEncrypted?: boolean;
  onSave?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  className?: string;
}

export default function Header({ 
  isEncrypted = false, 
  onSave, 
  onDownload, 
  onShare, 
  onSettings,
  className 
}: HeaderProps) {
  const [showWalletModal, setShowWalletModal] = useState(false);
  return (
    <header className={cn(
      "bg-white border-b border-gray-200 px-6 py-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">WalrusCanvas AI</h1>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Shield className={cn(
              "w-4 h-4",
              isEncrypted ? "text-green-500" : "text-gray-400"
            )} />
            <span className={cn(
              isEncrypted ? "text-green-600" : "text-gray-500"
            )}>
              {isEncrypted ? 'Encrypted' : 'Not Encrypted'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Wallet Status */}
          <WalletStatus onConnect={() => setShowWalletModal(true)} />
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onSave}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>

            <button
              onClick={onDownload}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              onClick={onShare}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            <button
              onClick={onSettings}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import { Shield, Save, Download, Share2, Settings } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { cn } from '@/utils/helpers';
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
  const currentAccount = useCurrentAccount();
  const isWalletConnected = !!currentAccount;
  return (
    <header className={cn(
      "header px-6 py-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border-2 border-white">
              <span className="text-black font-bold text-sm">W</span>
            </div>
            <h1 className="text-xl font-bold text-white">WalrusCanvas AI</h1>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-white">
            <Shield className={cn(
              "w-4 h-4",
              isEncrypted ? "text-green-400" : "text-gray-300"
            )} />
            <span className={cn(
              isEncrypted ? "text-green-400" : "text-gray-300"
            )}>
              {isEncrypted ? 'Encrypted' : 'Not Encrypted'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Wallet Status */}
          <WalletStatus onConnect={() => setShowWalletModal(true)} />
          
          {/* Action buttons - only show when wallet is not connected */}
          {!isWalletConnected && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onSave}
                className="header-button flex items-center space-x-2 px-4 py-2 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                <span>Save to Walrus</span>
              </button>

              <button
                onClick={onDownload}
                className="header-secondary-button flex items-center space-x-2 px-3 py-2 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button
                onClick={onShare}
                className="header-secondary-button flex items-center space-x-2 px-3 py-2 text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <button
                onClick={onSettings}
                className="p-2 text-white hover:text-gray-300 focus:outline-none rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          )}
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

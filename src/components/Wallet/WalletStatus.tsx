'use client';

import React, { useState } from 'react';
import { Wallet, LogOut, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/utils/helpers';

interface WalletStatusProps {
  onConnect: () => void;
}

export default function WalletStatus({ onConnect }: WalletStatusProps) {
  const { isConnected, address, balance, disconnect, refreshBalance } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    const balance = parseFloat(bal) / 1e9; // Convert from MIST to SUI
    return balance.toFixed(4);
  };

  const handleViewOnExplorer = () => {
    if (!address) return;
    const explorerUrl = `https://suiexplorer.com/address/${address}?network=testnet`;
    window.open(explorerUrl, '_blank');
  };

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Wallet Info */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">Connected</span>
      </div>

      {/* Address */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <span className="text-sm font-mono text-gray-700">
          {formatAddress(address!)}
        </span>
        <button
          onClick={handleCopyAddress}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          title="Copy address"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
        <button
          onClick={handleViewOnExplorer}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          title="View on explorer"
        >
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Balance */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <span className="text-sm text-blue-800">
          {formatBalance(balance)} SUI
        </span>
        <button
          onClick={handleRefreshBalance}
          disabled={isRefreshing}
          className="p-1 text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={disconnect}
        className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        title="Disconnect wallet"
      >
        <LogOut className="w-4 h-4" />
        <span>Disconnect</span>
      </button>
    </div>
  );
}

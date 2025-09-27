'use client';

import React, { useState, useCallback } from 'react';
import { RefreshCw, Copy, Check, ExternalLink, LogOut } from 'lucide-react';
import { useCurrentAccount, useCurrentWallet, useSuiClient, useDisconnectWallet, ConnectButton } from '@mysten/dapp-kit';
import { cn } from '@/utils/helpers';

interface WalletStatusProps {
  onConnect?: () => void;
}

export default function WalletStatus({ onConnect: _onConnect }: WalletStatusProps) {
  const currentAccount = useCurrentAccount();
  const currentWallet = useCurrentWallet();
  const suiClient = useSuiClient();
  const [balance, setBalance] = useState('0');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isConnected = !!currentAccount;
  const address = currentAccount?.address || null;
  const walletName = currentWallet && 'name' in currentWallet ? currentWallet.name as string : 'Connected Wallet';
  const walletType = currentWallet && 'name' in currentWallet ? 
    (currentWallet.name as string).toLowerCase().includes('slush') ? 'slush' :
    (currentWallet.name as string).toLowerCase().includes('sui wallet') ? 'sui-wallet' :
    (currentWallet.name as string).toLowerCase().includes('suiet') ? 'suiet' : 'slush' : null;

  const { mutateAsync: disconnectWallet, isPending: isDisconnecting } = useDisconnectWallet();

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

  const refreshBalance = useCallback(async () => {
    if (!currentAccount?.address) return;

    try {
      const balanceResult = await suiClient.getBalance({
        owner: currentAccount.address,
        coinType: '0x2::sui::SUI',
      });
      setBalance(balanceResult.totalBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [currentAccount?.address, suiClient]);

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
      <ConnectButton 
        connectText="Connect Wallet"
        className="!bg-blue-600 !text-white !px-4 !py-2 !rounded-lg !font-medium hover:!bg-blue-700 !transition-colors"
      />
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Wallet Info */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">
          {walletName || 'Connected'}
        </span>
        {walletType === 'unsafe-burner' && (
          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
            Dev
          </span>
        )}
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
        onClick={() => disconnectWallet()}
        disabled={isDisconnecting}
        className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
        title="Disconnect wallet"
      >
        <LogOut className="w-4 h-4" />
        <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
      </button>
    </div>
  );
}
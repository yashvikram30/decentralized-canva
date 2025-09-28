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
  const walletName = currentWallet && 'name' in currentWallet ? currentWallet.name as string : 'Wallet';
  const walletType = currentWallet && 'name' in currentWallet ? 
    (currentWallet.name as string).toLowerCase().includes('slush') ? 'slush' :
    (currentWallet.name as string).toLowerCase().includes('sui wallet') ? 'sui-wallet' :
    (currentWallet.name as string).toLowerCase().includes('suiet') ? 'suiet' :
    (currentWallet.name as string).toLowerCase().includes('unsafe-burner') ? 'unsafe-burner' : 'slush' : null;

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
        className="retro-button !w-[180px] !h-10 !px-4 !py-0 !font-bold hover:!bg-[var(--retro-accent)] !transition-colors !text-base !leading-none !flex !items-center !justify-center"
      />
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Disconnect Button - Only show disconnect when connected */}
      <button
        onClick={() => disconnectWallet()}
        disabled={isDisconnecting}
        className="retro-button w-[180px] h-10 px-4 py-0 disabled:opacity-60 hover:bg-[var(--retro-accent)] font-bold flex items-center justify-center space-x-2 leading-none"
        title="Disconnect wallet"
      >
        <LogOut className="w-5 h-5" />
        <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
      </button>
    </div>
  );
}
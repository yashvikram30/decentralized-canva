'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { config } from '@/config/environment';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  getSuiClient: () => SuiClient;
  /**
   * Return a signer-compatible object for use with SDKs that accept the wallet directly.
   * Returns the injected `window.suiWallet` object when available, otherwise null.
   */
  getSigner: () => any | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: '0',
    isConnecting: false,
    error: null,
  });

  const suiClient = new SuiClient({
    url: config.suiRpcUrl,
  });

  // Check for existing wallet connection on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      const isInstalled = await isSuiWalletInstalled();
      if (!isInstalled) {
        console.log('Sui Wallet not installed');
        return;
      }

      const wallet = (window as any).suiWallet;
      
      try {
        const accounts = await wallet.getAccounts();
        
        if (accounts.length > 0) {
          const address = accounts[0].address;
          setState(prev => ({
            ...prev,
            isConnected: true,
            address,
            error: null,
          }));
          await refreshBalance();
        }
      } catch (accountError) {
        console.log('Failed to get accounts:', accountError);
        setState(prev => ({
          ...prev,
          isConnected: false,
          address: null,
          error: 'no_accounts'
        }));
      }
    } catch (error) {
      console.log('Error checking wallet connection:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        error: 'wallet_not_installed'
      }));
    }
  };

  const isSuiWalletInstalled = () => {
    if (typeof window === 'undefined') return false;
    
    // Wait for window.suiWallet to be injected
    return new Promise<boolean>((resolve) => {
      if ((window as any).suiWallet) {
        resolve(true);
      } else {
        // Wait for wallet to be injected
        let retries = 0;
        const checkInterval = setInterval(() => {
          if ((window as any).suiWallet) {
            clearInterval(checkInterval);
            resolve(true);
          }
          retries++;
          if (retries > 10) { // Wait for max 5 seconds
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 500);
      }
    });
  };

  const connect = async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if Sui Wallet is available
      const isInstalled = await isSuiWalletInstalled();
      if (!isInstalled) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'wallet_not_installed'
        }));
        return;
      }

      const wallet = (window as any).suiWallet;
      
      try {
        // Request connection
        await wallet.requestPermissions();
      } catch (permissionError) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'connection_rejected'
        }));
        return;
      }
      
      // Get accounts
      const accounts = await wallet.getAccounts();
      if (accounts.length === 0) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'no_accounts'
        }));
        return;
      }

      const address = accounts[0].address;
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        address,
        isConnecting: false,
        error: null,
      }));

      // Refresh balance
      await refreshBalance();

      console.log('✅ Wallet connected:', address);
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  };

  const disconnect = () => {
    setState({
      isConnected: false,
      address: null,
      balance: '0',
      isConnecting: false,
      error: null,
    });
    console.log('🔌 Wallet disconnected');
  };

  const refreshBalance = async () => {
    if (!state.address) return;

    try {
      const balance = await suiClient.getBalance({
        owner: state.address,
        coinType: '0x2::sui::SUI',
      });

      setState(prev => ({
        ...prev,
        balance: balance.totalBalance,
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const getSuiClient = () => suiClient;

  const getSigner = () => {
    if (typeof window !== 'undefined' && (window as any).suiWallet) {
      return (window as any).suiWallet;
    }
    return null;
  };

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    getSuiClient,
    getSigner,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Declare global types for wallet
declare global {
  interface Window {
    suiWallet?: {
      requestPermissions: () => Promise<void>;
      getAccounts: () => Promise<Array<{ address: string }>>;
      signAndExecuteTransactionBlock: (params: {
        transactionBlock: any;
        account: any;
      }) => Promise<any>;
    };
  }
}

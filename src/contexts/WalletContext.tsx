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
      // Check if wallet is available in window
      if (typeof window !== 'undefined' && (window as any).suiWallet) {
        const wallet = (window as any).suiWallet;
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
      }
    } catch (error) {
      console.log('No existing wallet connection found');
    }
  };

  const connect = async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if Sui Wallet is available
      if (typeof window === 'undefined' || !(window as any).suiWallet) {
        throw new Error('Sui Wallet not found. Please install Sui Wallet extension.');
      }

      const wallet = (window as any).suiWallet;
      
      // Request connection
      await wallet.requestPermissions();
      
      // Get accounts
      const accounts = await wallet.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found in wallet');
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

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    getSuiClient,
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

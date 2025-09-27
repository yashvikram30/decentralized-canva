'use client';

import { WalletProvider, SuiClientProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { getFullnodeUrl } from '@mysten/sui/client';

// Create QueryClient instance
const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{ 
        testnet: { url: getFullnodeUrl('testnet') },
        mainnet: { url: getFullnodeUrl('mainnet') }
      }}>
        <WalletProvider
          slushWallet={{
            name: 'WalrusCanvas AI', // Required: Shows in Slush wallet UI
          }}
          autoConnect={false} // Disable auto-reconnect so manual disconnect persists
          preferredWallets={['Slush']} // Optional: Show Slush first
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
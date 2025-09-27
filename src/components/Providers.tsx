'use client';

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { getFullnodeUrl } from '@mysten/sui/client';

// Create QueryClient instance
const queryClient = new QueryClient();

// Create network configuration using official dApp Kit pattern
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
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
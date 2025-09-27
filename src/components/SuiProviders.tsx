'use client';

import { WalletProvider } from '@/contexts/WalletContext';

export default function SuiProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}
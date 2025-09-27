import { useSignAndExecuteTransaction, useSignPersonalMessage, useSignTransaction } from '@mysten/dapp-kit';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import type { SignatureWithBytes } from '@mysten/sui/cryptography';

/**
 * Proper wallet service using official dApp Kit patterns
 * This replaces the custom WalletSigner implementation
 */
export function useWalletService() {
  const currentAccount = useCurrentAccount();
  const currentWallet = useCurrentWallet();
  const suiClient = useSuiClient();
  
  // Use official dApp Kit hooks for signing
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const isConnected = !!currentAccount;
  const address = currentAccount?.address || null;
  const walletName = currentWallet && 'name' in currentWallet ? currentWallet.name : 'Unknown Wallet';

  // Check wallet capabilities
  const canSignPersonalMessage = currentWallet && 'features' in currentWallet ? (currentWallet.features as any)?.['sui:signPersonalMessage'] !== undefined : false;
  const canSignTransaction = currentWallet && 'features' in currentWallet ? (currentWallet.features as any)?.['sui:signTransactionBlock'] !== undefined : false;
  const canSignAndExecute = currentWallet && 'features' in currentWallet ? (currentWallet.features as any)?.['sui:signAndExecuteTransactionBlock'] !== undefined : false;

  // Sign personal message using official hook
  const signPersonalMessageData = async (message: Uint8Array) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    if (!canSignPersonalMessage) {
      throw new Error('Wallet does not support personal message signing');
    }

    return signPersonalMessage({
      message: message,
      account: currentAccount!,
    });
  };

  // Sign transaction using official hook
  const signTransactionData = async (transaction: Transaction) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    if (!canSignTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }

    return signTransaction({
      transaction: transaction as any,
      account: currentAccount!,
    });
  };

  // Sign and execute transaction using official hook
  const signAndExecuteTransactionData = async (transaction: Transaction) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    // If wallet supports sign and execute, use it
    if (canSignAndExecute) {
      return signAndExecuteTransaction({
        transaction: transaction as any,
        account: currentAccount!,
      });
    }
    
    // Fallback: sign the transaction and then execute it manually
    if (canSignTransaction) {
      console.log('Wallet does not support sign and execute, falling back to sign + execute');
      
      // First sign the transaction
      const signedTransaction = await signTransaction({
        transaction: transaction as any,
        account: currentAccount!,
      });
      
      // Then execute it using the Sui client
      return suiClient.executeTransactionBlock({
        transactionBlock: signedTransaction.bytes,
        signature: signedTransaction.signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
    }
    
    throw new Error('Wallet does not support transaction signing');
  };

  return {
    // Wallet state
    isConnected,
    address,
    walletName,
    currentAccount,
    currentWallet,
    suiClient,
    
    // Capabilities
    canSignPersonalMessage,
    canSignTransaction,
    canSignAndExecute,
    
    // Signing methods
    signPersonalMessage: signPersonalMessageData,
    signTransaction: signTransactionData,
    signAndExecuteTransaction: signAndExecuteTransactionData,
  };
}

// Legacy compatibility - create a signer-like object for Walrus
export function useWalletSigner() {
  const walletService = useWalletService();
  
  if (!walletService.isConnected) {
    return null;
  }

  // Create a signer-like object that implements the required interface for Walrus
  return {
    getAddress: () => walletService.address!,
    toSuiAddress: () => walletService.address!,
    signPersonalMessage: walletService.signPersonalMessage,
    signTransaction: walletService.signTransaction,
    signAndExecuteTransaction: walletService.signAndExecuteTransaction,
  };
}

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

  // Check wallet capabilities (support both legacy and new feature keys)
  const walletFeatures: Record<string, unknown> =
    currentWallet && 'features' in currentWallet
      ? ((currentWallet as any).features ?? {})
      : {};

  const hasFeature = (name: string) => walletFeatures && walletFeatures[name] !== undefined;

  const canSignPersonalMessage = hasFeature('sui:signPersonalMessage');
  const canSignTransaction = hasFeature('sui:signTransactionBlock') || hasFeature('sui:signTransaction');
  const canSignAndExecute = hasFeature('sui:signAndExecuteTransactionBlock') || hasFeature('sui:signAndExecuteTransaction');

  if (process.env.NODE_ENV === 'development') {
    try {
      // Helpful capability debug output
      // eslint-disable-next-line no-console
      console.debug('[wallet] features:', Object.keys(walletFeatures || {}));
      // eslint-disable-next-line no-console
      console.debug('[wallet] canSignTx:', canSignTransaction, 'canSignAndExecute:', canSignAndExecute, 'canSignMsg:', canSignPersonalMessage);
    } catch {}
  }

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

  // Normalize inputs for both raw Transaction and Walrus-style arg object
  type TxInput = Transaction | { transaction: Transaction | string; client?: any; account?: any; chain?: string };

  const normalizeTxInput = (
    input: TxInput
  ): { transaction: Transaction | string; account: any; client?: any } => {
    if (typeof input === 'object' && input && 'transaction' in input) {
      return {
        transaction: (input as any).transaction,
        account: (input as any).account ?? currentAccount!,
        client: (input as any).client,
      };
    }
    return { transaction: input as Transaction, account: currentAccount! };
  };

  // Sign transaction using official hook
  const signTransactionData = async (txInput: TxInput) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    const { transaction, account } = normalizeTxInput(txInput);
    try {
      return await signTransaction({
        transaction: transaction as any,
        account,
      });
    } catch (e) {
      // Surface original error; callers may choose to fall back
      throw e instanceof Error ? e : new Error('Transaction signing failed');
    }
  };

  // Sign and execute transaction with typed effects result compatible with Walrus
  const signAndExecuteTransactionData = async (txInput: TxInput) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    const { transaction, account, client } = normalizeTxInput(txInput);

    // Always prefer sign + execute via a SuiClient to ensure typed `effects`
    const executionClient = client && typeof client.executeTransactionBlock === 'function' ? client : suiClient;
    try {
      const signedTransaction = await signTransaction({
        transaction: transaction as any,
        account,
      });
      const resp = await executionClient.executeTransactionBlock({
        transactionBlock: signedTransaction.bytes,
        signature: signedTransaction.signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
      // Build a compatibility shape expected by Walrus signer interface
      const changedObjects = (resp.objectChanges || [])
        .map((c: any) => (c.type === 'created' || c.type === 'mutated' || c.type === 'deleted' || c.type === 'transferred')
          ? { id: c.objectId, idOperation: c.type === 'created' ? 'Created' : c.type === 'mutated' ? 'Mutated' : c.type === 'deleted' ? 'Deleted' : 'Transferred' }
          : null)
        .filter(Boolean);
      return {
        digest: resp.digest,
        effects: {
          status: { error: resp.effects?.status?.error ?? null },
          changedObjects,
        },
      } as any;
    } catch (error) {
      // As a last resort, try the combined hook (may return base64 effects)
      try {
        const res = await signAndExecuteTransaction({
          transaction: transaction as any,
          account,
        });
        // Fetch full details by digest and normalize
        const tx = await suiClient.getTransactionBlock({
          digest: (res as any).digest,
          options: { showEffects: true, showObjectChanges: true },
        });
        const changedObjects = (tx.objectChanges || [])
          .map((c: any) => (c.type === 'created' || c.type === 'mutated' || c.type === 'deleted' || c.type === 'transferred')
            ? { id: c.objectId, idOperation: c.type === 'created' ? 'Created' : c.type === 'mutated' ? 'Mutated' : c.type === 'deleted' ? 'Deleted' : 'Transferred' }
            : null)
          .filter(Boolean);
        return {
          digest: tx.digest,
          effects: {
            status: { error: tx.effects?.status?.error ?? null },
            changedObjects,
          },
        } as any;
      } catch (_e) {
        throw error instanceof Error ? error : new Error('Wallet failed to sign and execute transaction');
      }
    }
  };

  return {
    // Wallet state
    isConnected,
    address,
    walletName,
    currentAccount,
    currentWallet,
    suiClient,
    // Address helpers expected by some SDKs
    getAddress: () => address!,
    toSuiAddress: () => address!,
    
    // Capabilities
    canSignPersonalMessage,
    canSignTransaction,
    canSignAndExecute,
    
    // Signing methods
    signPersonalMessage: signPersonalMessageData,
    signTransaction: signTransactionData,
    signAndExecuteTransaction: signAndExecuteTransactionData,
    // Aliases for libraries that expect *Block method names
    signTransactionBlock: signTransactionData as unknown as (tx: unknown) => Promise<SignatureWithBytes>,
    signAndExecuteTransactionBlock: signAndExecuteTransactionData as unknown as (tx: unknown) => Promise<any>,
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
    // Provide aliases commonly used by SDKs
    signTransactionBlock: (tx: any) => walletService.signTransaction(tx),
    signAndExecuteTransactionBlock: (tx: any) => walletService.signAndExecuteTransaction(tx),
  };
}

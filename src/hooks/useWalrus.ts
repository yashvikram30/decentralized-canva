import { useState, useCallback } from 'react';
import { walrusClient, type WalrusBlobData, type WalrusStoreResult, type WalrusRetrieveResult } from '@/services/walrusClient';
import type { Signer } from '@mysten/sui/cryptography';

export interface WalrusState {
  isStoring: boolean;
  isRetrieving: boolean;
  isDeleting: boolean;
  isEncrypting: boolean;
  isDecrypting: boolean;
  isBatchLoading: boolean;
  isLoadingWithAssets: boolean;
  error: string | null;
}

export function useWalrus() {
  const [state, setState] = useState<WalrusState>({
    isStoring: false,
    isRetrieving: false,
    isDeleting: false,
    isEncrypting: false,
    isDecrypting: false,
    isBatchLoading: false,
    isLoadingWithAssets: false,
    error: null,
  });

  const store = useCallback(async (
    data: WalrusBlobData, 
    signer: Signer, 
    epochs: number = 1,
    tags?: Record<string, string>,
    userAddress?: string
  ): Promise<WalrusStoreResult> => {
    try {
      setState(prev => ({ ...prev, isStoring: true, error: null }));
      
      // Show encryption state if data is encrypted
      if (data.metadata.encrypted) {
        setState(prev => ({ ...prev, isEncrypting: true }));
      }
      
      const result = await walrusClient.store(data, signer, epochs, tags, userAddress);
      
      setState(prev => ({ 
        ...prev, 
        isStoring: false, 
        isEncrypting: false 
      }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isStoring: false,
        isEncrypting: false,
        error: error instanceof Error ? error.message : 'Storage failed' 
      }));
      throw error;
    }
  }, []);

  const retrieve = useCallback(async (blobId: string, userAddress?: string): Promise<WalrusRetrieveResult> => {
    try {
      setState(prev => ({ ...prev, isRetrieving: true, error: null }));
      
      // Show decryption state if user address provided (might be encrypted)
      if (userAddress) {
        setState(prev => ({ ...prev, isDecrypting: true }));
      }
      
      const result = await walrusClient.retrieve(blobId, userAddress);
      
      setState(prev => ({ 
        ...prev, 
        isRetrieving: false,
        isDecrypting: false
      }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isRetrieving: false,
        isDecrypting: false,
        error: error instanceof Error ? error.message : 'Retrieval failed' 
      }));
      throw error;
    }
  }, []);

  const deleteBlob = useCallback(async (blobId: string, signer: Signer) => {
    try {
      setState(prev => ({ ...prev, isDeleting: true, error: null }));
      const result = await walrusClient.delete(blobId, signer);
      setState(prev => ({ ...prev, isDeleting: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Deletion failed' 
      }));
      throw error;
    }
  }, []);

  const retrieveMultiple = useCallback(async (blobIds: string[], userAddress?: string) => {
    try {
      setState(prev => ({ ...prev, isBatchLoading: true, error: null }));
      
      // Show decryption state if user address provided (might be encrypted)
      if (userAddress) {
        setState(prev => ({ ...prev, isDecrypting: true }));
      }
      
      const results = await walrusClient.retrieveMultiple(blobIds, userAddress);
      
      setState(prev => ({ 
        ...prev, 
        isBatchLoading: false,
        isDecrypting: false
      }));
      return results;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isBatchLoading: false,
        isDecrypting: false,
        error: error instanceof Error ? error.message : 'Batch retrieval failed' 
      }));
      throw error;
    }
  }, []);

  const retrieveDesignWithAssets = useCallback(async (designBlobId: string, userAddress?: string) => {
    try {
      setState(prev => ({ ...prev, isLoadingWithAssets: true, error: null }));
      
      // Show decryption state if user address provided (might be encrypted)
      if (userAddress) {
        setState(prev => ({ ...prev, isDecrypting: true }));
      }
      
      const result = await walrusClient.retrieveDesignWithAssets(designBlobId, userAddress);
      
      setState(prev => ({ 
        ...prev, 
        isLoadingWithAssets: false,
        isDecrypting: false
      }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoadingWithAssets: false,
        isDecrypting: false,
        error: error instanceof Error ? error.message : 'Design with assets retrieval failed' 
      }));
      throw error;
    }
  }, []);

  const storeDesignWithAssets = useCallback(async (
    designData: WalrusBlobData,
    assets: { [key: string]: Uint8Array } = {},
    signer: Signer,
    epochs: number = 1,
    userAddress?: string
  ) => {
    try {
      setState(prev => ({ ...prev, isStoring: true, error: null }));
      
      // Show encryption state if data is encrypted
      if (designData.metadata.encrypted) {
        setState(prev => ({ ...prev, isEncrypting: true }));
      }
      
      const result = await walrusClient.storeDesignWithAssets(designData, assets, signer, epochs, userAddress);
      
      setState(prev => ({ 
        ...prev, 
        isStoring: false, 
        isEncrypting: false 
      }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isStoring: false,
        isEncrypting: false,
        error: error instanceof Error ? error.message : 'Storage with assets failed' 
      }));
      throw error;
    }
  }, []);

  const getSystemInfo = useCallback(async () => {
    try {
      return await walrusClient.getSystemInfo();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to get system info' 
      }));
      throw error;
    }
  }, []);

  const testBlobId = useCallback(async (blobId: string) => {
    try {
      return await walrusClient.testBlobId(blobId);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to test blob ID' 
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    store,
    retrieve,
    retrieveMultiple,
    retrieveDesignWithAssets,
    storeDesignWithAssets,
    delete: deleteBlob,
    getSystemInfo,
    testBlobId,
  };
}

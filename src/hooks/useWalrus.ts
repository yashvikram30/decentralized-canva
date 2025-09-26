import { useState, useCallback } from 'react';
import { walrusClient } from '@/services/walrusClient';
import type { Signer } from '@mysten/sui/cryptography';

export interface WalrusState {
  isStoring: boolean;
  isRetrieving: boolean;
  isDeleting: boolean;
  error: string | null;
}

export function useWalrus() {
  const [state, setState] = useState<WalrusState>({
    isStoring: false,
    isRetrieving: false,
    isDeleting: false,
    error: null,
  });

  const store = useCallback(async (data: any, signer: Signer, epochs: number = 3) => {
    try {
      setState(prev => ({ ...prev, isStoring: true, error: null }));
      const result = await walrusClient.store(data, signer, epochs);
      setState(prev => ({ ...prev, isStoring: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isStoring: false,
        error: error instanceof Error ? error.message : 'Storage failed' 
      }));
      throw error;
    }
  }, []);

  const retrieve = useCallback(async (blobId: string) => {
    try {
      setState(prev => ({ ...prev, isRetrieving: true, error: null }));
      const result = await walrusClient.retrieve(blobId);
      setState(prev => ({ ...prev, isRetrieving: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isRetrieving: false,
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

  return {
    ...state,
    store,
    retrieve,
    delete: deleteBlob,
  };
}

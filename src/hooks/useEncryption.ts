import { useState, useEffect, useCallback } from 'react';
import { sealEncryption } from '@/services/sealEncryption';

export interface EncryptionState {
  isInitialized: boolean;
  isEncrypting: boolean;
  isDecrypting: boolean;
  error: string | null;
}

export function useEncryption() {
  const [state, setState] = useState<EncryptionState>({
    isInitialized: false,
    isEncrypting: false,
    isDecrypting: false,
    error: null,
  });

  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await sealEncryption.initialize();
      setState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Encryption initialization failed' 
      }));
    }
  }, []);

  const encrypt = useCallback(async (data: Uint8Array, userAddress: string, accessPolicy?: any) => {
    try {
      setState(prev => ({ ...prev, isEncrypting: true, error: null }));
      const result = await sealEncryption.encryptData(data, userAddress, accessPolicy);
      setState(prev => ({ ...prev, isEncrypting: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isEncrypting: false,
        error: error instanceof Error ? error.message : 'Encryption failed' 
      }));
      throw error;
    }
  }, []);

  const decrypt = useCallback(async (encryptedData: Uint8Array, accessPolicyId: string, userAddress: string) => {
    try {
      setState(prev => ({ ...prev, isDecrypting: true, error: null }));
      const result = await sealEncryption.decryptData(encryptedData, accessPolicyId, userAddress);
      setState(prev => ({ ...prev, isDecrypting: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isDecrypting: false,
        error: error instanceof Error ? error.message : 'Decryption failed' 
      }));
      throw error;
    }
  }, []);

  const updateAccessPolicy = useCallback(async (blobId: string, newPolicy: any) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const result = await sealEncryption.updateAccessPolicy(blobId, newPolicy);
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Policy update failed' 
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...state,
    encrypt,
    decrypt,
    updateAccessPolicy,
    isReady: sealEncryption.isReady(),
  };
}

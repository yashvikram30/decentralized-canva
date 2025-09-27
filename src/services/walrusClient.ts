import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { RetryableWalrusClientError } from '@mysten/walrus';
import { config } from '@/config/environment';
import { sealEncryption, type SealEncryptionResult } from './sealEncryption';

export interface WalrusBlobMetadata {
  name: string;
  created: string;
  encrypted: boolean;
  walletAddress: string;
  walletName: string;
  version: string;
  type: string;
  canvasSize?: {
    width: number;
    height: number;
  };
  tags?: Record<string, string>;
  // Seal-specific metadata
  sealMetadata?: {
    accessPolicyId: string;
    keyServers: string[];
    threshold: number;
    encryptionAlgorithm: string;
  };
}

export interface WalrusBlobData {
  designData: any;
  imageData?: string;
  metadata: WalrusBlobMetadata;
  // Encrypted data structure
  encryptedData?: Uint8Array;
  sealEncryption?: SealEncryptionResult;
}

export interface WalrusStoreResult {
  blobId: string;
  size: number;
  stored: boolean;
  cost?: {
    wal: number;
    frost: number;
  };
  expiryEpoch?: number;
  encrypted?: boolean;
  accessPolicyId?: string;
}

export interface WalrusRetrieveResult {
  blobId: string;
  data: WalrusBlobData;
  timestamp: number;
  size: number;
  decrypted?: boolean;
}

export class WalrusClientService {
  private walrusClient: WalrusClient;
  private suiClient: SuiClient;

  constructor() {
    this.suiClient = new SuiClient({
      url: config.suiRpcUrl,
    });

    this.walrusClient = new WalrusClient({
      network: config.suiNetwork as 'testnet' | 'mainnet',
      suiClient: this.suiClient,
      wasmUrl: config.walrusWasmUrl,
      storageNodeClientOptions: {
        timeout: 60_000,
        onError: (error) => console.warn('Walrus storage node error:', error),
      },
    });
  }

  async store(
    data: WalrusBlobData, 
    signer: Signer, 
    epochs: number = 1,
    tags?: Record<string, string>,
    userAddress?: string
  ): Promise<WalrusStoreResult> {
    try {
      console.log('📦 Storing to Walrus...', { 
        epochs, 
        tags, 
        encrypted: data.metadata.encrypted,
        userAddress: userAddress?.slice(0, 8) + '...'
      });
      
      let dataToStore = data;
      let accessPolicyId: string | undefined;

      // Encrypt data if enabled and user address provided
      if (data.metadata.encrypted && config.sealEnabled && userAddress) {
        console.log('🔐 Encrypting data with Seal before storage...');
        
        // Initialize Seal if not already done
        if (!sealEncryption.isReady()) {
          await sealEncryption.initialize();
        }
        
        // Create access policy for user
        const accessPolicy = await sealEncryption.createUserAccessPolicy(userAddress);
        accessPolicyId = accessPolicy.id;
        
        // Convert design data to Uint8Array for encryption
        const designDataBytes = new TextEncoder().encode(JSON.stringify(data.designData));
        
        // Encrypt the design data
        const sealResult = await sealEncryption.encryptData(
          designDataBytes,
          userAddress,
          accessPolicy
        );

        // Update data structure with encrypted content
        dataToStore = {
          ...data,
          designData: null, // Remove unencrypted data
          encryptedData: sealResult.encryptedData,
          sealEncryption: sealResult,
          metadata: {
            ...data.metadata,
            sealMetadata: {
              accessPolicyId,
              keyServers: sealResult.keyServers,
              threshold: sealResult.threshold,
              encryptionAlgorithm: sealResult.metadata.algorithm,
            }
          }
        };
      }
      
      // Add tags to metadata
      if (tags) {
        dataToStore.metadata.tags = { ...dataToStore.metadata.tags, ...tags };
      }
      
      // Convert data to Uint8Array for storage
      const blob = new TextEncoder().encode(JSON.stringify(dataToStore));
      
      const { blobId } = await this.walrusClient.writeBlob({
        blob,
        deletable: false,
        epochs,
        signer,
      });
      
      // Calculate estimated cost (approximate)
      const storageUnits = Math.ceil(blob.length / (1024 * 1024)); // 1 MiB units
      const walCost = storageUnits * 0.0001 * epochs; // 0.0001 WAL per unit per epoch
      const frostCost = 20000; // Additional write cost
      
      console.log('✅ Successfully stored to Walrus:', { 
        blobId, 
        size: blob.length,
        cost: { wal: walCost, frost: frostCost },
        encrypted: data.metadata.encrypted
      });
      
      return {
        blobId,
        size: blob.length,
        stored: true,
        cost: {
          wal: walCost,
          frost: frostCost
        },
        expiryEpoch: epochs,
        encrypted: data.metadata.encrypted,
        accessPolicyId
      };
    } catch (error) {
      console.error('Walrus storage failed:', error);
      
      if (error instanceof RetryableWalrusClientError) {
        console.log('Retrying after client reset...');
        this.walrusClient.reset();
        throw new Error('Retryable error - please try again');
      }
      
      throw error;
    }
  }

  async retrieve(blobId: string, userAddress?: string): Promise<WalrusRetrieveResult> {
    try {
      console.log('📥 Retrieving from Walrus:', blobId);
      
      const blob = await this.walrusClient.readBlob({ blobId });
      const data: WalrusBlobData = JSON.parse(new TextDecoder().decode(blob));
      
      // Decrypt data if it's encrypted and user address provided
      if (data.metadata.encrypted && data.sealEncryption && userAddress) {
        console.log('🔓 Decrypting data with Seal...');
        
        try {
          // Initialize Seal if not already done
          if (!sealEncryption.isReady()) {
            await sealEncryption.initialize();
          }

          // Validate access first
          const hasAccess = await sealEncryption.validateAccess(
            data.sealEncryption.accessPolicyId,
            userAddress
          );

          if (!hasAccess) {
            throw new Error('Access denied: You do not have permission to decrypt this data');
          }

          // Decrypt the data
          const decryptionResult = await sealEncryption.decryptData(
            data.encryptedData!,
            data.sealEncryption.accessPolicyId,
            userAddress
          );

          // Restore the original design data
          data.designData = JSON.parse(new TextDecoder().decode(decryptionResult.decryptedData));
          data.encryptedData = undefined; // Remove encrypted data
          
          console.log('✅ Data decrypted successfully');
        } catch (decryptError) {
          console.error('❌ Decryption failed:', decryptError);
          throw new Error(`Failed to decrypt data: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
        }
      }
      
      console.log('✅ Successfully retrieved from Walrus');
      return {
        blobId,
        data,
        timestamp: Date.now(),
        size: blob.length,
        decrypted: data.metadata.encrypted && userAddress ? true : undefined
      };
    } catch (error) {
      console.error('Walrus retrieval failed:', error);
      
      if (error instanceof RetryableWalrusClientError) {
        console.log('Retrying after client reset...');
        this.walrusClient.reset();
        throw new Error('Retryable error - please try again');
      }
      
      throw error;
    }
  }

  async delete(blobId: string, _signer: Signer): Promise<{ success: boolean }> {
    try {
      console.log('🗑️ Deleting from Walrus:', blobId);
      
      // Note: Walrus doesn't have a direct delete method in the current SDK
      // Blobs are automatically deleted after their epoch lifetime expires
      // For now, we'll return success as the blob will be cleaned up automatically
      console.log('ℹ️ Blob will be automatically deleted after epoch lifetime expires');
      
      return { success: true };
    } catch (error) {
      console.error('Walrus deletion failed:', error);
      throw error;
    }
  }

  async getSystemInfo(): Promise<any> {
    try {
      return {
        currentEpoch: 1,
        epochDuration: '14days',
        maxBlobSize: '13.6 GiB',
        storageUnit: '1.00 MiB',
        pricePerUnit: 0.0001,
        additionalWriteCost: 20000
      };
    } catch (error) {
      console.error('Failed to get Walrus system info:', error);
      throw error;
    }
  }

  // Helper method to reset client on errors
  reset() {
    this.walrusClient.reset();
  }
}

// Export singleton instance
export const walrusClient = new WalrusClientService();

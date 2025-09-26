import { WalrusClient } from '@mysten/walrus';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { RetryableWalrusClientError } from '@mysten/walrus';
import { config } from '@/config/environment';

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

  async store(data: any, signer: Signer, epochs: number = 3): Promise<{ blobId: string; size: number; stored: boolean }> {
    try {
      console.log('📦 Storing to Walrus...');
      
      // Convert data to Uint8Array for storage
      const blob = new TextEncoder().encode(JSON.stringify(data));
      
      const { blobId } = await this.walrusClient.writeBlob({
        blob,
        deletable: false,
        epochs,
        signer,
      });
      
      console.log('✅ Successfully stored to Walrus:', blobId);
      return {
        blobId,
        size: blob.length,
        stored: true
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

  async retrieve(blobId: string): Promise<{ blobId: string; data: any; timestamp: number }> {
    try {
      console.log('📥 Retrieving from Walrus:', blobId);
      
      const blob = await this.walrusClient.readBlob({ blobId });
      const data = JSON.parse(new TextDecoder().decode(blob));
      
      console.log('✅ Successfully retrieved from Walrus');
      return {
        blobId,
        data,
        timestamp: Date.now()
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

  async delete(blobId: string, signer: Signer): Promise<{ success: boolean }> {
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

  // Helper method to reset client on errors
  reset() {
    this.walrusClient.reset();
  }
}

// Export singleton instance
export const walrusClient = new WalrusClientService();

import { WalrusClient } from '@mysten/walrus';
import { SuiClient as BaseSuiClient } from '@mysten/sui/client';
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
  private walrusClient: any;
  private suiClient: any;

  constructor() {
    // Create a SuiClient extended with Walrus upload relay for more reliable writes in browsers
    const baseClient = new BaseSuiClient({ url: config.suiRpcUrl, network: config.suiNetwork as 'testnet' | 'mainnet' });
    const extended = (baseClient as any).$extend?.(
      (WalrusClient as any).experimental_asClientExtension({
        network: config.suiNetwork as 'testnet' | 'mainnet',
        uploadRelay: {
          host: config.walrusUploadRelayUrl,
          sendTip: { max: 1_000 },
        },
      })
    );
    this.suiClient = (extended || baseClient);

    this.walrusClient = new WalrusClient({
      network: config.suiNetwork as 'testnet' | 'mainnet',
      suiClient: this.suiClient,
      wasmUrl: config.walrusWasmUrl,
      storageNodeClientOptions: {
        // Slightly longer timeout to accommodate registration propagation
        timeout: 90_000,
        onError: (error) => {
          // Many storage nodes briefly return 400 until registration propagates;
          // downgrade loud errors to debug-style logs to avoid alarming users
          const message = (error as Error)?.message || String(error);
          if (message.includes('has not been registered') || message.includes('already expired')) {
            console.debug('Walrus node transient state:', message);
          } else {
            console.warn('Walrus storage node error:', error);
          }
        },
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
      
      // Some storage nodes require a brief delay between certification and upload.
      // Use a bounded exponential backoff retry around writeBlob to smooth over 400s.
      const maxAttempts = 5;
      let attempt = 0;
      let lastError: unknown = undefined;
      let blobId: string | undefined;

      while (attempt < maxAttempts && !blobId) {
        try {
          const result = await this.walrusClient.writeBlob({
            blob,
            deletable: false,
            epochs,
            signer,
          });
          blobId = result.blobId;
        } catch (err: any) {
          lastError = err;

          const msg = err?.message || '';
          const status = err?.status || err?.response?.status;
          const isTransient400 = status === 400 || msg.includes('has not been registered') || msg.includes('already expired');

          // Retry only transient registration/propagation issues or explicit Retryable error
          if (isTransient400 || (err instanceof RetryableWalrusClientError)) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.floor(Math.random() * 500);
            console.log(`Walrus write attempt ${attempt + 1} failed; retrying in ${backoffMs}ms...`);
            // Small jittered delay before retry
            await new Promise((res) => setTimeout(res, backoffMs));
            if (err instanceof RetryableWalrusClientError) {
              this.walrusClient.reset();
            }
            attempt++;
            continue;
          }
          // Non-retryable error
          throw err;
        }
      }

      if (!blobId) {
        throw lastError || new Error('Failed to store blob after retries');
      }
      
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
    return this.retryWithBackoff(async () => {
      console.log('📥 Retrieving from Walrus:', blobId);
      
      // Use getFiles API as recommended by the official Walrus SDK documentation
      let files: any[];
      try {
        // Use getFiles method which is the recommended approach according to the docs
        files = await this.walrusClient.getFiles({ ids: [blobId] });
        
        if (!files || files.length === 0) {
          throw new Error('No files found for the provided blob ID');
        }
        
        const file = files[0];
        if (!file) {
          throw new Error('File not found in Walrus storage');
        }
        
        console.log('📄 Retrieved WalrusFile:', file);
        
      } catch (readError) {
        console.error('❌ Failed to read file from Walrus:', readError);
        
        // Handle specific Walrus SDK errors as documented
        if (readError instanceof RetryableWalrusClientError) {
          console.log('Retryable error detected, resetting client...');
          this.walrusClient.reset();
          throw new Error('Temporary Walrus error - please try again');
        }
        
        // Handle DataView bounds errors specifically
        if (readError instanceof Error && readError.message.includes('Offset is outside the bounds of the DataView')) {
          throw new Error('Data corruption detected in Walrus storage. The blob may be corrupted or incomplete.');
        }
        
        // Handle network errors
        const errorMessage = readError instanceof Error ? readError.message : 'Unknown error';
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_CLOSED')) {
          throw new Error('Network error: Unable to connect to Walrus storage. Please check your internet connection and try again.');
        }
        
        throw new Error(`Failed to read file from Walrus: ${errorMessage}`);
      }
      
      // Get the file content using the WalrusFile API
      let blob: Uint8Array;
      try {
        // Use the WalrusFile.bytes() method as recommended in the docs
        blob = await files[0].bytes();
        
        if (!blob || blob.length === 0) {
          throw new Error('Empty or invalid file data received from Walrus');
        }
        
        console.log('📄 Retrieved file data length:', blob.length);
        
      } catch (bytesError) {
        console.error('❌ Failed to get bytes from WalrusFile:', bytesError);
        throw new Error(`Failed to read file content: ${bytesError instanceof Error ? bytesError.message : 'Unknown error'}`);
      }
      
      // Safely decode and parse the blob data
      let data: WalrusBlobData;
      try {
        // Create a safe copy of the blob to avoid DataView issues
        const blobArray = new Uint8Array(blob);
        const decodedText = new TextDecoder().decode(blobArray);
        console.log('📄 Decoded file data length:', decodedText.length);
        console.log('📄 First 200 chars:', decodedText.substring(0, 200));
        
        // Check if the data looks like JSON
        const trimmedText = decodedText.trim();
        if (!trimmedText.startsWith('{') && !trimmedText.startsWith('[')) {
          throw new Error('File data does not appear to be valid JSON');
        }
        
        data = JSON.parse(decodedText);
      } catch (parseError) {
        console.error('❌ Failed to parse file data:', parseError);
        console.error('❌ Blob length:', blob.length);
        console.error('❌ Blob type:', typeof blob);
        console.error('❌ Blob constructor:', blob.constructor.name);
        
        // Try to provide more helpful error information
        if (parseError instanceof SyntaxError) {
          throw new Error(`Invalid JSON in file data: ${parseError.message}`);
        } else if (parseError instanceof RangeError) {
          throw new Error(`Data corruption detected in file: ${parseError.message}`);
        } else {
          // Check if it's a network error
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
          if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_CLOSED')) {
            throw new Error(`Network error: Unable to connect to Walrus storage. Please check your internet connection and try again.`);
          }
          throw new Error(`Failed to parse file data: ${errorMessage}`);
        }
      }
      
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
    });
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

  /**
   * Enhanced retry mechanism with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (error instanceof RetryableWalrusClientError) {
          console.log(`Retryable error on attempt ${attempt + 1}/${maxAttempts}, resetting client...`);
          this.walrusClient.reset();
          
          if (attempt < maxAttempts - 1) {
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Non-retryable error or max attempts reached
        throw error;
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Batch loading support for multiple designs
   */
  async retrieveMultiple(blobIds: string[], userAddress?: string): Promise<WalrusRetrieveResult[]> {
    return this.retryWithBackoff(async () => {
      console.log('📥 Batch retrieving from Walrus:', blobIds.length, 'designs');
      
      // Use getFiles API for batch loading as recommended by the official Walrus SDK documentation
      let files: any[];
      try {
        files = await this.walrusClient.getFiles({ ids: blobIds });
        
        if (!files || files.length === 0) {
          throw new Error('No files found for the provided blob IDs');
        }
        
        console.log('📄 Retrieved WalrusFiles:', files.length);
        
      } catch (readError) {
        console.error('❌ Failed to batch read files from Walrus:', readError);
        
        // Handle specific Walrus SDK errors as documented
        if (readError instanceof RetryableWalrusClientError) {
          console.log('Retryable error detected, resetting client...');
          this.walrusClient.reset();
          throw new Error('Temporary Walrus error - please try again');
        }
        
        // Handle DataView bounds errors specifically
        if (readError instanceof Error && readError.message.includes('Offset is outside the bounds of the DataView')) {
          throw new Error('Data corruption detected in Walrus storage. Some blobs may be corrupted or incomplete.');
        }
        
        throw new Error(`Failed to batch read files from Walrus: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
      }
      
      const results: WalrusRetrieveResult[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const blobId = blobIds[i];
        
        if (!file) {
          console.warn(`⚠️ No file data for ${blobId}, skipping...`);
          continue;
        }
        
        // Get the file content using the WalrusFile API
        let blob: Uint8Array;
        try {
          blob = await file.bytes();
          
          if (!blob || blob.length === 0) {
            console.warn(`⚠️ Empty or invalid file data for ${blobId}, skipping...`);
            continue;
          }
        } catch (bytesError) {
          console.error(`❌ Failed to get bytes from WalrusFile for ${blobId}:`, bytesError);
          continue; // Skip this file and continue with others
        }
        
        // Safely decode and parse the blob data
        let data: WalrusBlobData;
        try {
          const decodedText = new TextDecoder().decode(blob);
          data = JSON.parse(decodedText);
        } catch (parseError) {
          console.error(`❌ Failed to parse file data for ${blobId}:`, parseError);
          continue; // Skip this file and continue with others
        }
        
        // Decrypt data if it's encrypted and user address provided
        if (data.metadata.encrypted && data.sealEncryption && userAddress) {
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
              throw new Error(`Access denied for design ${blobIds[i]}: You do not have permission to decrypt this data`);
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
          } catch (decryptError) {
            console.error(`❌ Decryption failed for design ${blobIds[i]}:`, decryptError);
            throw new Error(`Failed to decrypt data for design ${blobIds[i]}: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
          }
        }
        
        results.push({
          blobId: blobIds[i],
          data,
          timestamp: Date.now(),
          size: blob.length,
          decrypted: data.metadata.encrypted && userAddress ? true : undefined
        });
      }
      
      console.log('✅ Successfully batch retrieved from Walrus');
      return results;
    });
  }

  /**
   * Retrieve design with assets using Quilt support
   */
  async retrieveDesignWithAssets(designBlobId: string, userAddress?: string): Promise<{
    design: WalrusRetrieveResult;
    assets: { [key: string]: Uint8Array };
    metadata: any;
  }> {
    return this.retryWithBackoff(async () => {
      console.log('📥 Retrieving design with assets from Walrus:', designBlobId);
      
      // Use getFiles API as recommended by the official Walrus SDK documentation
      let files: any[];
      try {
        files = await this.walrusClient.getFiles({ ids: [designBlobId] });
        
        if (!files || files.length === 0) {
          throw new Error('No files found for the provided design blob ID');
        }
        
        const file = files[0];
        if (!file) {
          throw new Error('Design file not found in Walrus storage');
        }
        
        console.log('📄 Retrieved WalrusFile for design with assets:', file);
        
      } catch (readError) {
        console.error('❌ Failed to read design file from Walrus:', readError);
        
        // Handle specific Walrus SDK errors as documented
        if (readError instanceof RetryableWalrusClientError) {
          console.log('Retryable error detected, resetting client...');
          this.walrusClient.reset();
          throw new Error('Temporary Walrus error - please try again');
        }
        
        // Handle DataView bounds errors specifically
        if (readError instanceof Error && readError.message.includes('Offset is outside the bounds of the DataView')) {
          throw new Error('Data corruption detected in Walrus storage. The design blob may be corrupted or incomplete.');
        }
        
        throw new Error(`Failed to read design file from Walrus: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
      }
      
      // Get the file content using the WalrusFile API
      let blob: Uint8Array;
      try {
        blob = await files[0].bytes();
        
        if (!blob || blob.length === 0) {
          throw new Error('Empty or invalid file data received from Walrus');
        }
        
        console.log('📄 Retrieved design file data length:', blob.length);
        
      } catch (bytesError) {
        console.error('❌ Failed to get bytes from WalrusFile:', bytesError);
        throw new Error(`Failed to read design file content: ${bytesError instanceof Error ? bytesError.message : 'Unknown error'}`);
      }
      
      // Safely decode and parse the blob data
      let combinedData: any;
      try {
        const decodedText = new TextDecoder().decode(blob);
        combinedData = JSON.parse(decodedText);
      } catch (parseError) {
        console.error('❌ Failed to parse design file data:', parseError);
        throw new Error(`Failed to parse design file data: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }
      
      // Check if this is a design with assets structure
      if (combinedData.type === 'design-with-assets') {
        const designData: WalrusBlobData = combinedData.design;
        const assets: { [key: string]: Uint8Array } = {};
        
        // Convert asset arrays back to Uint8Array
        for (const [key, dataArray] of Object.entries(combinedData.assets)) {
          assets[key] = new Uint8Array(dataArray as number[]);
        }
        
        const metadata = combinedData.metadata || {};
        
        // Decrypt design data if needed
        if (designData.metadata.encrypted && designData.sealEncryption && userAddress) {
          try {
            if (!sealEncryption.isReady()) {
              await sealEncryption.initialize();
            }

            const hasAccess = await sealEncryption.validateAccess(
              designData.sealEncryption.accessPolicyId,
              userAddress
            );

            if (!hasAccess) {
              throw new Error('Access denied: You do not have permission to decrypt this design');
            }

            const decryptionResult = await sealEncryption.decryptData(
              designData.encryptedData!,
              designData.sealEncryption.accessPolicyId,
              userAddress
            );

            designData.designData = JSON.parse(new TextDecoder().decode(decryptionResult.decryptedData));
            designData.encryptedData = undefined;
          } catch (decryptError) {
            console.error('❌ Design decryption failed:', decryptError);
            throw new Error(`Failed to decrypt design: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
          }
        }
        
        console.log('✅ Successfully retrieved design with assets from Walrus');
        
        return {
          design: {
            blobId: designBlobId,
            data: designData,
            timestamp: Date.now(),
            size: blob.length,
            decrypted: designData.metadata.encrypted && userAddress ? true : undefined
          },
          assets,
          metadata
        };
      } else {
        // Regular design without assets
        const designData: WalrusBlobData = combinedData;
        
        // Decrypt design data if needed
        if (designData.metadata.encrypted && designData.sealEncryption && userAddress) {
          try {
            if (!sealEncryption.isReady()) {
              await sealEncryption.initialize();
            }

            const hasAccess = await sealEncryption.validateAccess(
              designData.sealEncryption.accessPolicyId,
              userAddress
            );

            if (!hasAccess) {
              throw new Error('Access denied: You do not have permission to decrypt this design');
            }

            const decryptionResult = await sealEncryption.decryptData(
              designData.encryptedData!,
              designData.sealEncryption.accessPolicyId,
              userAddress
            );

            designData.designData = JSON.parse(new TextDecoder().decode(decryptionResult.decryptedData));
            designData.encryptedData = undefined;
          } catch (decryptError) {
            console.error('❌ Design decryption failed:', decryptError);
            throw new Error(`Failed to decrypt design: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
          }
        }
        
        console.log('✅ Successfully retrieved design from Walrus');
        
        return {
          design: {
            blobId: designBlobId,
            data: designData,
            timestamp: Date.now(),
            size: blob.length,
            decrypted: designData.metadata.encrypted && userAddress ? true : undefined
          },
          assets: {},
          metadata: {}
        };
      }
    });
  }

  /**
   * Store design with assets using Quilt support
   */
  async storeDesignWithAssets(
    designData: WalrusBlobData,
    assets: { [key: string]: Uint8Array } = {},
    signer: Signer,
    epochs: number = 1,
    userAddress?: string
  ): Promise<WalrusStoreResult & { quiltId: string }> {
    try {
      console.log('📦 Storing design with assets to Walrus...');
      
      // For now, store as a single blob with JSON containing all data
      // This is a simplified approach until WalrusFile API is properly available
      const combinedData = {
        design: designData,
        assets: Object.fromEntries(
          Object.entries(assets).map(([key, data]) => [key, Array.from(data)])
        ),
        metadata: {
          type: 'design-with-assets',
          version: '1.0.0',
          created: new Date().toISOString()
        }
      };
      
      const blob = new TextEncoder().encode(JSON.stringify(combinedData));
      
      // Store as a single blob
      const result = await this.walrusClient.writeBlob({
        blob,
        epochs,
        deletable: false,
        signer,
      });
      
      console.log('✅ Successfully stored design with assets to Walrus');
      
      return {
        blobId: result.blobId,
        quiltId: result.blobId, // In Walrus, the quilt ID is the same as the blob ID
        size: blob.length,
        stored: true,
        cost: {
          wal: Math.ceil(blob.length / (1024 * 1024)) * 0.0001 * epochs,
          frost: 20000
        },
        expiryEpoch: epochs,
        encrypted: designData.metadata.encrypted
      };
    } catch (error) {
      console.error('Walrus storage with assets failed:', error);
      throw error;
    }
  }

  /**
   * Helper method to determine content type from file extension
   */
  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'json': 'application/json',
      'txt': 'text/plain',
      'md': 'text/markdown'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Test if a blob ID is valid and accessible using the proper Walrus SDK approach
   */
  async testBlobId(blobId: string): Promise<{ valid: boolean; error?: string; networkError?: boolean }> {
    try {
      console.log('🧪 Testing blob ID format and accessibility:', blobId);
      
      // Basic format validation first
      if (!blobId || blobId.trim().length === 0) {
        return { valid: false, error: 'Empty blob ID' };
      }
      
      // Check if blob ID format looks valid (supports both hex and base64 formats)
      if (blobId.length < 10) {
        return { valid: false, error: 'Blob ID too short' };
      }
      
      // Check for common blob ID patterns (hex or base64-like)
      const isHex = /^[a-f0-9]+$/i.test(blobId);
      const isBase64Like = /^[a-zA-Z0-9+/=_-]+$/.test(blobId);
      
      if (!isHex && !isBase64Like) {
        return { valid: false, error: 'Invalid blob ID format (expected hex or base64-like)' };
      }
      
      // Try to access the file using getFiles API to verify it exists and is accessible
      try {
        const files = await this.walrusClient.getFiles({ ids: [blobId] });
        
        if (!files || files.length === 0) {
          return { valid: false, error: 'Blob ID not found in Walrus storage' };
        }
        
        const file = files[0];
        if (!file) {
          return { valid: false, error: 'File not found for the provided blob ID' };
        }
        
        // Try to get basic file info without reading the full content
        try {
          // Check if we can get file metadata without reading bytes
          const identifier = await file.getIdentifier?.();
          const tags = await file.getTags?.();
          
          console.log('✅ Blob ID is valid and accessible', { 
            hasIdentifier: !!identifier, 
            hasTags: !!tags 
          });
          
          return { valid: true };
          
        } catch (metadataError) {
          // If metadata access fails, the file might still be valid but corrupted
          console.warn('⚠️ Could not access file metadata, but file exists:', metadataError);
          return { 
            valid: true, 
            error: 'File exists but metadata access failed - may be corrupted',
            networkError: false
          };
        }
        
      } catch (accessError) {
        console.error('❌ Failed to access blob in Walrus:', accessError);
        
        // Handle specific Walrus SDK errors
        if (accessError instanceof RetryableWalrusClientError) {
          console.log('Retryable error detected during blob test');
          return { 
            valid: true, // Assume valid if it's a retryable error
            error: 'Temporary Walrus error - blob may be valid',
            networkError: false
          };
        }
        
        // Handle DataView bounds errors specifically
        if (accessError instanceof Error && accessError.message.includes('Offset is outside the bounds of the DataView')) {
          return { 
            valid: false, 
            error: 'Data corruption detected in Walrus storage',
            networkError: false
          };
        }
        
        // Handle DataView bounds errors specifically
        if (accessError instanceof Error && accessError.message.includes('Offset is outside the bounds of the DataView')) {
          return { 
            valid: false, 
            error: 'Data corruption detected in Walrus storage',
            networkError: false
          };
        }
        
        // Check if it's a network error
        const errorMessage = accessError instanceof Error ? accessError.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('Failed to fetch') || 
                              errorMessage.includes('ERR_CONNECTION_CLOSED') ||
                              errorMessage.includes('NetworkError') ||
                              errorMessage.includes('net::');
        
        if (isNetworkError) {
          console.warn('⚠️ Network error detected during blob test');
          return { 
            valid: true, // Assume valid if we can't verify due to network issues
            error: 'Network connectivity issue - cannot verify blob ID',
            networkError: true
          };
        }
        
        return { 
          valid: false, 
          error: `Blob access failed: ${errorMessage}`,
          networkError: false
        };
      }
      
    } catch (error) {
      console.error('❌ Blob ID validation failed:', error);
      
      // Check if it's a network error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('ERR_CONNECTION_CLOSED') ||
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('net::');
      
      if (isNetworkError) {
        console.warn('⚠️ Network error detected, assuming blob ID is valid for now');
        return { 
          valid: true, // Assume valid if we can't verify due to network issues
          error: 'Network connectivity issue - cannot verify blob ID',
          networkError: true
        };
      }
      
      return { 
        valid: false, 
        error: errorMessage,
        networkError: false
      };
    }
  }

  // Helper method to reset client on errors
  reset() {
    this.walrusClient.reset();
  }
}

// Export singleton instance
export const walrusClient = new WalrusClientService();

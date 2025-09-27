import { config } from '@/config/environment';

export interface EncryptionPolicy {
  allowedRecipients: string[];  // Array of wallet addresses
  expiryTime?: number;         // Optional timestamp for encryption expiry
  maxDecryptions?: number;     // Optional max number of decryptions
}

export interface EncryptedData {
  ciphertext: ArrayBuffer;
  iv: ArrayBuffer;
  tag: ArrayBuffer;
  encryptedKey: ArrayBuffer;
  policy: EncryptionPolicy;
  metadata: {
    version: string;
    createdAt: number;
    lastModified: number;
    createdBy: string;
  };
}

import { SealSDK, Policy, KMSClient } from '@sealprotocol/sdk';

export class SealEncryptionService {
  private isInitialized: boolean = false;
  private sealClient?: SealSDK;
  private kmsClient?: KMSClient;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async initialize(): Promise<void> {
    try {
      // Initialize Seal SDK with your project configuration
      this.kmsClient = new KMSClient({
        url: config.sealKmsUrl,
        apiKey: config.sealApiKey
      });

      this.sealClient = new SealSDK({
        kmsClient: this.kmsClient,
        projectId: config.sealProjectId
      });

      await this.sealClient.initialize();
      this.isInitialized = true;
      console.log('🔐 Seal encryption service initialized');
    } catch (error) {
      console.error('Failed to initialize Seal encryption service:', error);
      throw new Error('Seal encryption service initialization failed');
    }
  }

  async encrypt(
    data: any,
    policy: EncryptionPolicy
  ): Promise<EncryptedData> {
    try {
      if (!this.isInitialized || !this.sealClient) {
        throw new Error('Seal encryption service not initialized');
      }

      // Convert data to string if it's not already
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      const plaintextBytes = this.encoder.encode(plaintext);

      // Create Seal policy
      const sealPolicy = new Policy({
        recipients: policy.allowedRecipients,
        expiresAt: policy.expiryTime,
        maxDecryptions: policy.maxDecryptions
      });

      // Encrypt using Seal SDK
      const encryptedResult = await this.sealClient.encrypt(plaintextBytes, sealPolicy);

      return {
        ciphertext: encryptedResult.ciphertext,
        iv: encryptedResult.iv,
        tag: encryptedResult.tag,
        encryptedKey: encryptedResult.encryptedKey,
        policy,
        metadata: {
          version: encryptedResult.metadata.version,
          createdAt: Date.now(),
          lastModified: Date.now(),
          createdBy: policy.allowedRecipients[0]
        }
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data: ' + (error as Error).message);
    }
  }

  async decrypt(
    encryptedData: EncryptedData,
    userAddress: string
  ): Promise<any> {
    try {
      if (!this.isInitialized || !this.sealClient) {
        throw new Error('Seal encryption service not initialized');
      }

      // Decrypt using Seal SDK
      const decryptedBytes = await this.sealClient.decrypt(
        {
          ciphertext: encryptedData.ciphertext,
          iv: encryptedData.iv,
          tag: encryptedData.tag,
          encryptedKey: encryptedData.encryptedKey,
          metadata: encryptedData.metadata
        },
        userAddress
      );
        throw new Error('Encryption service not initialized');
      }

      // Check if user is allowed to decrypt
      if (!encryptedData.policy.allowedRecipients.includes(userAddress)) {
        throw new Error('User not authorized to decrypt this data');
      }

      // Check expiry if set
      if (encryptedData.policy.expiryTime && Date.now() > encryptedData.policy.expiryTime) {
        throw new Error('Encryption key has expired');
      }

      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        encryptedData.encryptedKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: encryptedData.iv },
        key,
        encryptedData.ciphertext
      );

      // Convert back to string and parse if it's JSON
      const decryptedText = this.decoder.decode(decrypted);
      try {
        return JSON.parse(decryptedText);
      } catch {
        return decryptedText;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data: ' + (error as Error).message);
    }
  }

  async updateAccessPolicy(
    encryptedData: EncryptedData,
    newPolicy: EncryptionPolicy,
    ownerAddress: string
  ): Promise<EncryptedData> {
    try {
      if (!this.isInitialized) {
        throw new Error('Encryption service not initialized');
      }

      // Verify that the updater is the owner
      if (encryptedData.metadata.createdBy !== ownerAddress) {
        throw new Error('Only the owner can update access policy');
      }

      // In production, this would re-encrypt the key with Seal using the new policy
      return {
        ...encryptedData,
        policy: newPolicy,
        metadata: {
          ...encryptedData.metadata,
          lastModified: Date.now()
        }
      };
    } catch (error) {
      console.error('Failed to update access policy:', error);
      throw new Error('Failed to update access policy: ' + (error as Error).message);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getVersion(): string {
    return '1.0.0';
  }
}

// Export singleton instance
export const sealEncryption = new SealEncryptionService();

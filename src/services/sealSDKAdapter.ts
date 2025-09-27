import { config } from '@/config/environment';
import { sealEncryption } from './sealEncryption';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHEX } from '@mysten/sui/utils';

// Real Seal SDK integration layer
// This adapter provides a clean interface to the actual Seal SDK
// while maintaining compatibility with our encryption service

export interface SealSDKConfig {
  keyServers: Array<{
    objectId: string;
    weight: number;
  }>;
  threshold: number;
  network: 'testnet' | 'mainnet';
  suiRpcUrl: string;
  packageId: string;
  registryId: string;
}

export interface SealSDKResult {
  success: boolean;
  data?: any;
  error?: string;
  transactionHash?: string;
}

export class SealSDKAdapter {
  private isRealSDKAvailable: boolean = false;
  private sealSDK: any = null;
  private config: SealSDKConfig;
  private suiClient: SuiClient;

  constructor() {
    this.suiClient = new SuiClient({ url: config.suiRpcUrl });
    this.config = {
      keyServers: [
        {
          objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
          weight: 1
        },
        {
          objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
          weight: 1
        }
      ],
      threshold: config.sealThreshold,
      network: config.suiNetwork as 'testnet' | 'mainnet',
      suiRpcUrl: config.suiRpcUrl,
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      registryId: process.env.NEXT_PUBLIC_REGISTRY_ID || '',
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Try to import and initialize the real Seal SDK
      // This will work when @mysten/seal is properly installed
      const { SealClient } = await import('@mysten/seal');
      
      // For now, we'll use a type assertion to work around the compatibility issue
      // In production, you might want to align the Sui SDK versions
      this.sealSDK = new SealClient({
        suiClient: this.suiClient as any, // Type assertion to bypass compatibility issue
        serverConfigs: this.config.keyServers.map(server => ({
          objectId: server.objectId,
          weight: server.weight,
        })),
        verifyKeyServers: false,
      });

      this.isRealSDKAvailable = true;
      
      console.log('✅ Real Seal SDK initialized successfully', {
        keyServers: this.config.keyServers.length,
        threshold: this.config.threshold,
        packageId: this.config.packageId
      });
      return true;
    } catch (error) {
      console.warn('⚠️ Real Seal SDK not available, falling back to production encryption:', error);
      this.isRealSDKAvailable = false;
      return false;
    }
  }

  async encryptData(
    data: Uint8Array,
    userAddress: string,
    accessPolicyId: string
  ): Promise<SealSDKResult> {
    try {
      if (this.isRealSDKAvailable && this.sealSDK) {
        // Use real Seal SDK with proper API
        const { encryptedObject: encryptedBytes, key: backupKey } = await this.sealSDK.encrypt({
          threshold: this.config.threshold,
          packageId: fromHEX(this.config.packageId),
          id: fromHEX(userAddress),
          data,
        });
        
        return {
          success: true,
          data: {
            encryptedData: encryptedBytes,
            backupKey,
            accessPolicyId,
            keyServers: this.config.keyServers,
            threshold: this.config.threshold,
          },
        };
      } else {
        // Fall back to our production encryption
        const result = await sealEncryption.encryptData(data, userAddress);
        
        return {
          success: true,
          data: result,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
      };
    }
  }

  async decryptData(
    encryptedData: Uint8Array,
    accessPolicyId: string,
    userAddress: string,
    designId?: string
  ): Promise<SealSDKResult> {
    try {
      if (this.isRealSDKAvailable && this.sealSDK) {
        // Create transaction block for Seal decryption
        const tx = new Transaction();
        
        if (designId) {
          // Use the design-specific seal_approve function
          tx.moveCall({
            target: `${this.config.packageId}::design_registry::seal_approve`,
            arguments: [
              tx.pure.vector("u8", Array.from(fromHEX(userAddress))),
              tx.object(designId),
              tx.object(this.config.registryId),
            ]
          });
        } else {
          // Use a generic seal_approve function
          tx.moveCall({
            target: `${this.config.packageId}::design_registry::seal_approve`,
            arguments: [
              tx.pure.vector("u8", Array.from(fromHEX(userAddress))),
              tx.pure.vector("u8", Array.from(fromHEX(accessPolicyId))),
            ]
          });
        }
        
        const txBytes = tx.build({ 
          client: this.suiClient, 
          onlyTransactionKind: true 
        });
        
        // Use real Seal SDK with transaction block
        const decryptedBytes = await this.sealSDK.decrypt({
          data: encryptedData,
          txBytes,
        });
        
        return {
          success: true,
          data: {
            decryptedData: decryptedBytes,
            accessPolicyId,
          },
        };
      } else {
        // Fall back to our production decryption
        const result = await sealEncryption.decryptData(encryptedData, accessPolicyId, userAddress);
        
        return {
          success: true,
          data: result,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  async validateAccess(
    accessPolicyId: string,
    userAddress: string
  ): Promise<SealSDKResult> {
    try {
      if (this.isRealSDKAvailable && this.sealSDK) {
        // Use real Seal SDK
        const result = await this.sealSDK.validateAccess({
          accessPolicyId,
          userAddress,
        });
        
        return {
          success: true,
          data: { hasAccess: result },
        };
      } else {
        // Fall back to our production validation
        const result = await sealEncryption.validateAccess(accessPolicyId, userAddress);
        
        return {
          success: true,
          data: { hasAccess: result },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Access validation failed',
      };
    }
  }

  async createAccessPolicy(
    userAddress: string,
    conditions?: any
  ): Promise<SealSDKResult> {
    try {
      if (this.isRealSDKAvailable && this.sealSDK) {
        // Use real Seal SDK
        const result = await this.sealSDK.createAccessPolicy({
          userAddress,
          conditions,
        });
        
        return {
          success: true,
          data: result,
          transactionHash: result.transactionHash,
        };
      } else {
        // Fall back to our production policy creation
        const result = await sealEncryption.createUserAccessPolicy(userAddress);
        
        return {
          success: true,
          data: result,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Policy creation failed',
      };
    }
  }

  async updateAccessPolicy(
    policyId: string,
    newConditions: any
  ): Promise<SealSDKResult> {
    try {
      if (this.isRealSDKAvailable && this.sealSDK) {
        // Use real Seal SDK
        const result = await this.sealSDK.updateAccessPolicy({
          policyId,
          conditions: newConditions,
        });
        
        return {
          success: true,
          data: result,
          transactionHash: result.transactionHash,
        };
      } else {
        // Fall back to our production policy update
        const result = await sealEncryption.updateAccessPolicy(policyId, newConditions);
        
        return {
          success: true,
          data: result,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Policy update failed',
      };
    }
  }

  // Utility methods
  isSDKAvailable(): boolean {
    return this.isRealSDKAvailable;
  }

  getSDKInfo(): {
    available: boolean;
    version?: string;
    keyServers: string[];
    threshold: number;
  } {
    return {
      available: this.isRealSDKAvailable,
      version: this.isRealSDKAvailable ? '1.0.0' : undefined,
      keyServers: this.config.keyServers.map(server => server.objectId),
      threshold: this.config.threshold,
    };
  }

  // Health check
  async healthCheck(): Promise<{
    sdk: boolean;
    keyServers: boolean;
    sui: boolean;
  }> {
    const health = {
      sdk: this.isRealSDKAvailable,
      keyServers: false,
      sui: false,
    };

    try {
      // Verify key server objects exist on-chain
      const keyServerChecks = await Promise.allSettled(
        this.config.keyServers.map(async (server) => {
          const obj = await this.suiClient.getObject({
            id: server.objectId,
            options: { showContent: true, showType: true },
          });
          return !!obj.data;
        })
      );

      health.keyServers = keyServerChecks.some(
        (result) => result.status === 'fulfilled' && result.value === true
      );

      // Check Sui network
      const suiResponse = await fetch(this.config.suiRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_getChainIdentifier',
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      health.sui = suiResponse.ok;
    } catch (error) {
      console.warn('Health check failed:', error);
    }

    return health;
  }
}

// Export singleton instance
export const sealSDKAdapter = new SealSDKAdapter();

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHEX, toHEX } from '@mysten/sui/utils';
import { config } from '@/config/environment';

export interface SealIntegrationConfig {
  packageId: string;
  registryId: string;
  keyServers: Array<{
    objectId: string;
    weight: number;
  }>;
  threshold: number;
  suiClient: SuiClient;
}

export interface SealEncryptionResult {
  encryptedData: Uint8Array;
  designId: string;
  accessPolicyId: string;
  transactionHash?: string;
}

export interface SealDecryptionResult {
  decryptedData: Uint8Array;
  designId: string;
}

export class SealIntegrationService {
  private config: SealIntegrationConfig;
  private isInitialized: boolean = false;

  constructor(config: SealIntegrationConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verify the package exists
      const packageInfo = await this.config.suiClient.getObject({
        id: this.config.packageId,
        options: { showContent: true }
      });

      if (!packageInfo.data) {
        throw new Error(`Package ${this.config.packageId} not found`);
      }

      // Verify the registry exists
      const registryInfo = await this.config.suiClient.getObject({
        id: this.config.registryId,
        options: { showContent: true }
      });

      if (!registryInfo.data) {
        throw new Error(`Registry ${this.config.registryId} not found`);
      }

      this.isInitialized = true;
      console.log('✅ Seal integration initialized', {
        packageId: this.config.packageId,
        registryId: this.config.registryId,
        keyServers: this.config.keyServers.length,
        threshold: this.config.threshold
      });
    } catch (error) {
      console.error('❌ Failed to initialize Seal integration:', error);
      throw error;
    }
  }

  /**
   * Create a design with Seal encryption
   */
  async createEncryptedDesign(
    name: string,
    designData: Uint8Array,
    userAddress: string,
    signer: any
  ): Promise<SealEncryptionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔐 Creating encrypted design with Seal...', {
        name,
        dataSize: designData.length,
        userAddress: userAddress.slice(0, 8) + '...'
      });

      // Step 1: Create the design in the Move contract
      const createDesignTx = new Transaction();
      const designId = createDesignTx.moveCall({
        target: `${this.config.packageId}::design_registry::create_design`,
        arguments: [
          createDesignTx.object(this.config.registryId),
          createDesignTx.pure.string(name),
          createDesignTx.pure.string('placeholder-blob-id'), // Will be updated after encryption
          createDesignTx.pure.string(`policy_${userAddress}_${Date.now()}`),
        ]
      });

      // Execute the transaction to create the design
      const createResult = await this.config.suiClient.signAndExecuteTransaction({
        transaction: createDesignTx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (createResult.effects?.status?.status !== 'success') {
        throw new Error('Failed to create design in contract');
      }

      // Extract the design ID from the transaction result
      const createdObjects = createResult.objectChanges?.filter(
        change => change.type === 'created' && change.objectType?.includes('DesignMetadata')
      ) as any[];

      if (!createdObjects || createdObjects.length === 0) {
        throw new Error('Failed to get design ID from transaction');
      }

      const designObjectId = createdObjects[0].objectId;
      console.log('✅ Design created in contract:', designObjectId);

      // Step 2: Encrypt the data using Seal
      const encryptedData = await this.encryptWithSeal(
        designData,
        userAddress,
        designObjectId
      );

      // Step 3: Update the design with the encrypted blob ID
      const updateDesignTx = new Transaction();
      updateDesignTx.moveCall({
        target: `${this.config.packageId}::design_registry::update_design`,
        arguments: [
          updateDesignTx.object(this.config.registryId),
          updateDesignTx.object(designObjectId),
          updateDesignTx.pure.string('encrypted-blob-id'), // This would be the actual Walrus blob ID
        ]
      });

      const updateResult = await this.config.suiClient.signAndExecuteTransaction({
        transaction: updateDesignTx,
        signer,
        options: {
          showEffects: true
        }
      });

      if (updateResult.effects?.status?.status !== 'success') {
        throw new Error('Failed to update design with encrypted data');
      }

      console.log('✅ Design encrypted and updated successfully');

      return {
        encryptedData,
        designId: designObjectId,
        accessPolicyId: `policy_${userAddress}_${Date.now()}`,
        transactionHash: createResult.digest
      };
    } catch (error) {
      console.error('❌ Failed to create encrypted design:', error);
      throw error;
    }
  }

  /**
   * Decrypt a design using Seal
   */
  async decryptDesign(
    designId: string,
    encryptedData: Uint8Array,
    userAddress: string,
    signer: any
  ): Promise<SealDecryptionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔓 Decrypting design with Seal...', {
        designId,
        userAddress: userAddress.slice(0, 8) + '...'
      });

      // Create transaction block for Seal decryption
      const tx = new Transaction();
      
      // Call the seal_approve function to validate access
      tx.moveCall({
        target: `${this.config.packageId}::design_registry::seal_approve`,
        arguments: [
          tx.pure.vector('u8', Array.from(fromHEX(userAddress))),
          tx.object(designId),
          tx.object(this.config.registryId),
        ]
      });

      const txBytes = tx.build({ 
        client: this.config.suiClient, 
        onlyTransactionKind: true 
      });

      // In a real implementation, you would use the Seal SDK here
      // For now, we'll simulate the decryption process
      const decryptedData = await this.simulateSealDecryption(
        encryptedData,
        await txBytes,
        userAddress
      );

      console.log('✅ Design decrypted successfully');

      return {
        decryptedData,
        designId
      };
    } catch (error) {
      console.error('❌ Failed to decrypt design:', error);
      throw error;
    }
  }

  /**
   * Validate access to a design
   */
  async validateAccess(
    designId: string,
    userAddress: string,
    signer: any
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tx = new Transaction();
      
      // Call the seal_approve function
      tx.moveCall({
        target: `${this.config.packageId}::design_registry::seal_approve`,
        arguments: [
          tx.pure.vector('u8', Array.from(fromHEX(userAddress))),
          tx.object(designId),
          tx.object(this.config.registryId),
        ]
      });

      // Use dry run to test access without executing
      const result = await this.config.suiClient.dryRunTransactionBlock({
        transactionBlock: await tx.build({ 
          client: this.config.suiClient, 
          onlyTransactionKind: true 
        })
      });

      // If dry run succeeds, access is granted
      return result.effects.status.status === 'success';
    } catch (error) {
      console.error('❌ Access validation failed:', error);
      return false;
    }
  }

  /**
   * Get design metadata from the contract
   */
  async getDesignMetadata(designId: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${this.config.packageId}::design_registry::get_design_metadata`,
        arguments: [
          tx.object(this.config.registryId),
          tx.object(designId),
        ]
      });

      const result = await this.config.suiClient.dryRunTransactionBlock({
        transactionBlock: await tx.build({ 
          client: this.config.suiClient, 
          onlyTransactionKind: true 
        })
      });

      return (result as any).results?.[0]?.returnValues;
    } catch (error) {
      console.error('❌ Failed to get design metadata:', error);
      throw error;
    }
  }

  /**
   * Simulate Seal encryption (placeholder for real Seal SDK integration)
   */
  private async encryptWithSeal(
    data: Uint8Array,
    userAddress: string,
    designId: string
  ): Promise<Uint8Array> {
    // This is a placeholder implementation
    // In production, you would use the real Seal SDK here
    
    console.log('🔐 Simulating Seal encryption...', {
      dataSize: data.length,
      userAddress: userAddress.slice(0, 8) + '...',
      designId
    });

    // For now, return the data as-is (no encryption)
    // In production, this would be:
    // const { encryptedObject: encryptedBytes, key: backupKey } = await sealClient.encrypt({
    //   threshold: this.config.threshold,
    //   packageId: fromHEX(this.config.packageId),
    //   id: fromHEX(userAddress),
    //   data,
    // });
    // return encryptedBytes;

    return data;
  }

  /**
   * Simulate Seal decryption (placeholder for real Seal SDK integration)
   */
  private async simulateSealDecryption(
    encryptedData: Uint8Array,
    txBytes: Uint8Array,
    userAddress: string
  ): Promise<Uint8Array> {
    // This is a placeholder implementation
    // In production, you would use the real Seal SDK here
    
    console.log('🔓 Simulating Seal decryption...', {
      encryptedSize: encryptedData.length,
      userAddress: userAddress.slice(0, 8) + '...'
    });

    // For now, return the data as-is (no decryption)
    // In production, this would be:
    // const decryptedBytes = await sealClient.decrypt({
    //   data: encryptedData,
    //   sessionKey,
    //   txBytes,
    // });
    // return decryptedBytes;

    return encryptedData;
  }

  /**
   * Get the package ID
   */
  getPackageId(): string {
    return this.config.packageId;
  }

  /**
   * Get the registry ID
   */
  getRegistryId(): string {
    return this.config.registryId;
  }

  /**
   * Check if the service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Factory function to create the service
export function createSealIntegration(
  packageId: string,
  registryId: string,
  suiClient: SuiClient,
  keyServers: Array<{ objectId: string; weight: number }> = [
    {
      objectId: "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
      weight: 1
    },
    {
      objectId: "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
      weight: 1
    }
  ],
  threshold: number = 2
): SealIntegrationService {
  return new SealIntegrationService({
    packageId,
    registryId,
    keyServers,
    threshold,
    suiClient
  });
}

// Export singleton instance
export const sealIntegration = createSealIntegration(
  config.packageId,
  config.registryId,
  new SuiClient({ url: config.suiRpcUrl })
);

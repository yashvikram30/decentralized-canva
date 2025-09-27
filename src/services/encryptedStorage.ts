import { sealEncryption } from './sealEncryption';
import { walrusClient } from './walrusClient';
import { accessControl, AccessPolicy } from './accessControl';

export interface StoredDesign {
  id: string;
  name: string;
  canvasData: any;
  encrypted: boolean;
  policyId: string;
  blobId: string;
  createdAt: number;
  updatedAt: number;
}

export class EncryptedStorageService {
  private designs: Map<string, StoredDesign> = new Map();

  async saveDesign(
    name: string, 
    canvasData: any, 
    owner: string, 
    signer: any,
    permissions: Partial<AccessPolicy['permissions']> = {}
  ): Promise<StoredDesign> {
    try {
      // Create access policy
      const policy = await accessControl.createPolicy(owner, permissions);
      
      // Encrypt the canvas data
      const canvasDataBytes = new TextEncoder().encode(JSON.stringify(canvasData));
      const sealPolicy = {
        id: policy.owner,
        owner: policy.owner,
        allowedUsers: policy.permissions.read,
        conditions: {
          minEpochs: 1,
          maxEpochs: 1000,
          requireWallet: true
        }
      };
      const encryptionResult = await sealEncryption.encryptData(canvasDataBytes, owner, sealPolicy);
      const encryptedData = encryptionResult.encryptedData;
      
      // Store in Walrus
      const walrusData = {
        designData: canvasData,
        metadata: {
          name: name,
          created: new Date().toISOString(),
          encrypted: true,
          walletAddress: owner,
          walletName: 'Encrypted Storage',
          walletType: 'encrypted',
          version: '1.0.0',
          type: 'canva-design',
          canvasSize: {
            width: 800,
            height: 600
          }
        },
        encryptedData: encryptedData,
        sealEncryption: {
          encryptedData: encryptedData,
          accessPolicyId: sealPolicy.id,
          keyServers: [],
          threshold: 2,
          metadata: {
            originalSize: canvasDataBytes.length,
            encryptedSize: encryptedData.length,
            algorithm: 'AES-256-CBC',
            timestamp: Date.now()
          }
        }
      };
      const storageResult = await walrusClient.store(walrusData, signer, 3);
      
      // Create design record
      const design: StoredDesign = {
        id: this.generateDesignId(),
        name,
        canvasData: encryptedData,
        encrypted: true,
        policyId: policy.owner, // Using owner as policy ID for simplicity
        blobId: storageResult.blobId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.designs.set(design.id, design);
      
      console.log('💾 Design saved with encryption:', design.id);
      return design;
    } catch (error) {
      console.error('Failed to save design:', error);
      throw error;
    }
  }

  async loadDesign(designId: string, user: string): Promise<StoredDesign | null> {
    try {
      const design = this.designs.get(designId);
      if (!design) return null;

      // Check permissions
      const hasReadPermission = await accessControl.checkPermission(design.policyId, user, 'read');
      if (!hasReadPermission) {
        throw new Error('Access denied: insufficient permissions');
      }

      // Retrieve from Walrus
      const storageData = await walrusClient.retrieve(design.blobId, user);
      
      // Decrypt the data
      const decryptionResult = await sealEncryption.decryptData(storageData.data.encryptedData!, design.policyId, user);
      const decryptedData = JSON.parse(new TextDecoder().decode(decryptionResult.decryptedData));
      
      // Return design with decrypted data
      return {
        ...design,
        canvasData: decryptedData,
        encrypted: false
      };
    } catch (error) {
      console.error('Failed to load design:', error);
      throw error;
    }
  }

  async updateDesign(designId: string, updates: Partial<StoredDesign>, user: string, signer: any): Promise<StoredDesign | null> {
    try {
      const design = this.designs.get(designId);
      if (!design) return null;

      // Check write permissions
      const hasWritePermission = await accessControl.checkPermission(design.policyId, user, 'write');
      if (!hasWritePermission) {
        throw new Error('Access denied: insufficient permissions');
      }

      // Encrypt updated data
      const canvasDataToEncrypt = updates.canvasData || design.canvasData;
      const canvasDataBytes = new TextEncoder().encode(JSON.stringify(canvasDataToEncrypt));
      const sealPolicy = {
        id: design.policyId,
        owner: design.policyId,
        allowedUsers: [design.policyId],
        conditions: {
          minEpochs: 1,
          maxEpochs: 1000,
          requireWallet: true
        }
      };
      const encryptionResult = await sealEncryption.encryptData(canvasDataBytes, user, sealPolicy);
      const encryptedData = encryptionResult.encryptedData;
      
      // Update in Walrus
      const walrusData = {
        designData: canvasDataToEncrypt,
        metadata: {
          name: design.name,
          created: new Date(design.createdAt).toISOString(),
          encrypted: true,
          walletAddress: user,
          walletName: 'Encrypted Storage',
          walletType: 'encrypted',
          version: '1.0.0',
          type: 'canva-design',
          canvasSize: {
            width: 800,
            height: 600
          }
        },
        encryptedData: encryptedData,
        sealEncryption: {
          encryptedData: encryptedData,
          accessPolicyId: sealPolicy.id,
          keyServers: [],
          threshold: 2,
          metadata: {
            originalSize: canvasDataBytes.length,
            encryptedSize: encryptedData.length,
            algorithm: 'AES-256-CBC',
            timestamp: Date.now()
          }
        }
      };
      await walrusClient.store(walrusData, signer, 3);
      
      // Update design record
      const updatedDesign = {
        ...design,
        ...updates,
        canvasData: encryptedData,
        encrypted: true,
        updatedAt: Date.now()
      };

      this.designs.set(designId, updatedDesign);
      
      console.log('📝 Design updated:', designId);
      return updatedDesign;
    } catch (error) {
      console.error('Failed to update design:', error);
      throw error;
    }
  }

  async deleteDesign(designId: string, user: string, signer: any): Promise<boolean> {
    try {
      const design = this.designs.get(designId);
      if (!design) return false;

      // Check admin permissions
      const hasAdminPermission = await accessControl.checkPermission(design.policyId, user, 'admin');
      if (!hasAdminPermission) {
        throw new Error('Access denied: insufficient permissions');
      }

      // Delete from Walrus
      await walrusClient.delete(design.blobId, signer);
      
      // Remove from local storage
      this.designs.delete(designId);
      
      console.log('🗑️ Design deleted:', designId);
      return true;
    } catch (error) {
      console.error('Failed to delete design:', error);
      throw error;
    }
  }

  async listDesigns(user: string): Promise<StoredDesign[]> {
    const userDesigns: StoredDesign[] = [];
    
    for (const design of this.designs.values()) {
      const hasReadPermission = await accessControl.checkPermission(design.policyId, user, 'read');
      if (hasReadPermission) {
        userDesigns.push(design);
      }
    }
    
    return userDesigns.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  private generateDesignId(): string {
    return 'design_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const encryptedStorage = new EncryptedStorageService();

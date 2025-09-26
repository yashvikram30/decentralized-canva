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
      const encryptedData = await sealEncryption.encrypt(canvasData, policy);
      
      // Store in Walrus
      const storageResult = await walrusClient.store(encryptedData, signer, 3);
      
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
      const storageData = await walrusClient.retrieve(design.blobId);
      
      // Decrypt the data
      const decryptedData = await sealEncryption.decrypt(storageData.data, user);
      
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
      const encryptedData = await sealEncryption.encrypt(updates.canvasData || design.canvasData, design.policyId);
      
      // Update in Walrus
      await walrusClient.store(encryptedData, signer, 3);
      
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

import { sealEncryption, EncryptionPolicy } from './sealEncryption';
import { walrusClient } from './walrusClient';
import { accessControl, AccessPolicy } from './accessControl';
import { versionControl } from './versionControl';

export interface StoredDesign {
  id: string;
  name: string;
  canvasData: any;
  encrypted: boolean;
  policyId: string;
  blobId: string;
  // Optional public blob id when design is published
  publicBlobId?: string;
  // Timestamp when published
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
  currentVersion: number;
  lastModifiedBy: string;
}

export class EncryptedStorageService {
  private designs: Map<string, StoredDesign> = new Map();

  async loadPublicDesign(blobId: string): Promise<any> {
    try {
      const blob = await walrusClient.retrieve(blobId);
      if (!blob || !blob.data) {
        throw new Error('Design not found');
      }
      // Public designs are not encrypted, so we can return the data directly
      return JSON.parse(new TextDecoder().decode(blob.data));
    } catch (error) {
      console.error('Failed to load public design:', error);
      throw error;
    }
  }

  private createEncryptionPolicy(policy: AccessPolicy): EncryptionPolicy {
    return {
      allowedRecipients: [
        policy.owner,
        ...(policy.permissions.read || []),
        ...(policy.permissions.write || [])
      ],
      expiryTime: policy.expiresAt
    };
  }

  async saveDesign(
    name: string, 
    canvasData: any, 
    owner: string, 
    signer: any,
    permissions: Partial<AccessPolicy['permissions']> = {}
  ): Promise<StoredDesign> {
    try {
            // Create access policy
      const { policy, policyId } = await accessControl.createPolicy(owner, permissions);
      
      // Create encryption policy
      const encryptionPolicy = this.createEncryptionPolicy(policy);

      // Encrypt the canvas data
      const encryptedData = await sealEncryption.encrypt(canvasData, encryptionPolicy);
      
      // Store encrypted data in Walrus
      const result = await walrusClient.store(encryptedData, signer);
      
      const designId = this.generateDesignId();
      
      // Create first version in version control
      const version = versionControl.createNewVersion(
        designId,
        encryptedData,
        {
          name,
          changedBy: owner,
          changeDescription: 'Initial version'
        }
      );

      const design: StoredDesign = {
        id: designId,
        name,
        canvasData: encryptedData,
        encrypted: true,
        policyId,
        blobId: result.blobId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        currentVersion: version.version,
        lastModifiedBy: owner
      };

      this.designs.set(design.id, design);
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

      // Get the access policy to create encryption policy
      const policy = await accessControl.getPolicy(design.policyId);
      const encryptionPolicy = policy ? this.createEncryptionPolicy(policy) : {
        allowedRecipients: [user],
        expiryTime: undefined
      };

      // Encrypt updated data
      const encryptedData = await sealEncryption.encrypt(updates.canvasData || design.canvasData, encryptionPolicy);
      
      // Update in Walrus
      const updateResult = await walrusClient.store(encryptedData, signer, 3);
      
      // Create new version in version control
      const version = versionControl.createNewVersion(
        designId,
        encryptedData,
        {
          name: updates.name || design.name,
          changedBy: user,
          changeDescription: 'Design updated'
        }
      );

      // Update design record
      const updatedDesign = {
        ...design,
        ...updates,
        canvasData: encryptedData,
        encrypted: true,
        blobId: updateResult.blobId || design.blobId,
        updatedAt: Date.now(),
        currentVersion: version.version,
        lastModifiedBy: user
      };

      this.designs.set(designId, updatedDesign);
      
      console.log('📝 Design updated:', designId);
      return updatedDesign;
    } catch (error) {
      console.error('Failed to update design:', error);
      throw error;
    }
  }

  /**
   * Publish a design: decrypts the private design (after permission check)
   * and stores an unencrypted, public copy on Walrus. Returns the public blobId.
   */
  async publishDesign(designId: string, user: string, signer: any, epochs: number = 3): Promise<{ publicBlobId: string }> {
    try {
      const design = this.designs.get(designId);
      if (!design) throw new Error('Design not found');

      // Only admins (owner) can publish
      const hasAdminPermission = await accessControl.checkPermission(design.policyId, user, 'admin');
      if (!hasAdminPermission) {
        throw new Error('Access denied: insufficient permissions to publish');
      }

      // Retrieve latest encrypted blob from Walrus
      const storageData = await walrusClient.retrieve(design.blobId);

      // Decrypt the data using Seal
      const decryptedData = await sealEncryption.decrypt(storageData.data, user);

      // Store decrypted (public) data on Walrus
      const publicStoreResult = await walrusClient.store(decryptedData, signer, epochs);

      console.log('🚀 Design published to Walrus (public):', publicStoreResult.blobId);

      // Update local record
      const updatedDesign: StoredDesign = {
        ...design,
        publicBlobId: publicStoreResult.blobId,
        publishedAt: Date.now(),
      };

      this.designs.set(designId, updatedDesign);

      return { publicBlobId: publicStoreResult.blobId };
    } catch (error) {
      console.error('Failed to publish design:', error);
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
      
      // If design has a public blob, delete that too
      if (design.publicBlobId) {
        await walrusClient.delete(design.publicBlobId, signer);
      }
      
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
import { IUserDesign } from '../models/UserDesign';

export interface UserDesignDocument {
  _id?: string;
  walletAddress: string;
  designId: string;
  name: string;
  canvasData: object; // Raw JSON canvas state for direct loading
  blobId?: string; // Optional - for encrypted version
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    canvasSize: { width: number; height: number };
    elementCount: number;
    lastModified: Date;
  };
}

export interface DesignData {
  name: string;
  canvasData: object;
  blobId?: string;
}

export class MongoDBService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/designs';
  }

  async saveUserDesign(
    walletAddress: string, 
    designData: DesignData
  ): Promise<UserDesignDocument> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          name: designData.name,
          canvasData: designData.canvasData,
          blobId: designData.blobId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save design');
      }

      const result = await response.json();
      return result.design;
    } catch (error) {
      console.error('Error saving user design:', error);
      throw new Error('Failed to save design to MongoDB');
    }
  }

  async getUserDesigns(walletAddress: string): Promise<UserDesignDocument[]> {
    try {
      const response = await fetch(`${this.baseUrl}?walletAddress=${encodeURIComponent(walletAddress)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch designs');
      }

      const result = await response.json();
      return result.designs;
    } catch (error) {
      console.error('Error fetching user designs:', error);
      throw new Error('Failed to fetch designs from MongoDB');
    }
  }

  async loadDesignToCanvas(designId: string): Promise<object> {
    try {
      const response = await fetch(`${this.baseUrl}/${designId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load design');
      }

      const result = await response.json();
      return result.canvasData;
    } catch (error) {
      console.error('Error loading design:', error);
      throw new Error('Failed to load design from MongoDB');
    }
  }

  async deleteUserDesign(designId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?designId=${encodeURIComponent(designId)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete design');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting design:', error);
      throw new Error('Failed to delete design from MongoDB');
    }
  }

  async updateUserDesign(
    _designId: string, 
    _updates: Partial<DesignData>
  ): Promise<boolean> {
    // For now, we'll implement this as a delete + create operation
    // In a production app, you'd want a proper PATCH endpoint
    try {
      // This is a simplified implementation
      // In production, you'd want a dedicated PATCH endpoint
      console.warn('Update operation not fully implemented - use delete + create for now');
      return false;
    } catch (error) {
      console.error('Error updating design:', error);
      throw new Error('Failed to update design in MongoDB');
    }
  }
}

// Singleton instance
export const mongoDBService = new MongoDBService();

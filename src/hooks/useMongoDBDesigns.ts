import { useState, useCallback } from 'react';
import { UserDesignDocument } from '../services/mongoDBService';

interface UseMongoDBDesignsReturn {
  designs: UserDesignDocument[];
  isLoading: boolean;
  error: string | null;
  loadDesignToCanvas: (designId: string, canvas: any) => Promise<void>;
  deleteDesign: (designId: string) => Promise<void>;
  refreshDesigns: (walletAddress: string) => Promise<void>;
}

export const useMongoDBDesigns = (): UseMongoDBDesignsReturn => {
  const [designs, setDesigns] = useState<UserDesignDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDesignToCanvas = useCallback(async (designId: string, canvas: any) => {
    if (!canvas) {
      throw new Error('Canvas not available');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Import the service dynamically to avoid SSR issues
      const { mongoDBService } = await import('../services/mongoDBService');
      const canvasData = await mongoDBService.loadDesignToCanvas(designId);
      
      // Load the JSON data directly into the canvas
      await new Promise<void>((resolve, reject) => {
        canvas.loadFromJSON(canvasData, () => {
          // Canvas loaded successfully
          canvas.renderAll();
          resolve();
        }, (error: any) => {
          console.error('Canvas load error:', error);
          reject(new Error('Failed to load design to canvas'));
        });
      });

      console.log('✅ Design loaded to canvas successfully');
    } catch (err) {
      console.error('Failed to load design to canvas:', err);
      setError(err instanceof Error ? err.message : 'Failed to load design');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDesign = useCallback(async (designId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Import the service dynamically to avoid SSR issues
      const { mongoDBService } = await import('../services/mongoDBService');
      const success = await mongoDBService.deleteUserDesign(designId);
      
      if (success) {
        // Remove from local state
        setDesigns(prev => prev.filter(design => design.designId !== designId));
        console.log('✅ Design deleted successfully');
      } else {
        throw new Error('Failed to delete design');
      }
    } catch (err) {
      console.error('Failed to delete design:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete design');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDesigns = useCallback(async (walletAddress: string) => {
    if (!walletAddress) {
      setDesigns([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Import the service dynamically to avoid SSR issues
      const { mongoDBService } = await import('../services/mongoDBService');
      const userDesigns = await mongoDBService.getUserDesigns(walletAddress);
      setDesigns(userDesigns);
    } catch (err) {
      console.error('Failed to fetch designs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch designs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    designs,
    isLoading,
    error,
    loadDesignToCanvas,
    deleteDesign,
    refreshDesigns
  };
};

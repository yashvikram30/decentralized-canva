import React, { useState, useEffect, useCallback } from 'react';
import { UserDesignDocument } from '../../services/mongoDBService';
import { DesignCard } from './DesignCard';

interface DesignsListProps {
  walletAddress: string | null;
  onLoadDesign: (designId: string) => Promise<void>;
  onDeleteDesign?: (designId: string) => Promise<void>;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

export const DesignsList: React.FC<DesignsListProps> = ({
  walletAddress,
  onLoadDesign,
  onDeleteDesign,
  refreshTrigger = 0
}) => {
  const [designs, setDesigns] = useState<UserDesignDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed viewMode since we only use wide cards now

  const fetchDesigns = useCallback(async () => {
    if (!walletAddress) {
      setDesigns([]);
      return;
    }

    console.log('📥 Fetching designs for wallet:', walletAddress);
    setIsLoading(true);
    setError(null);

    try {
      // Import the service dynamically to avoid SSR issues
      const { mongoDBService } = await import('../../services/mongoDBService');
      const userDesigns = await mongoDBService.getUserDesigns(walletAddress);
      console.log('📥 Fetched designs:', userDesigns.length);
      setDesigns(userDesigns);
    } catch (err) {
      console.error('Failed to fetch designs:', err);
      setError('Failed to load designs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchDesigns();
  }, [walletAddress, refreshTrigger, fetchDesigns]);

  const handleDeleteDesign = async (designId: string) => {
    if (!onDeleteDesign) return;

    try {
      await onDeleteDesign(designId);
      // Refresh the list after deletion
      await fetchDesigns();
    } catch (error) {
      console.error('Failed to delete design:', error);
    }
  };

  const handleRefresh = () => {
    fetchDesigns();
  };

  if (!walletAddress) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-4xl mb-2">🔐</div>
        <p className="text-sm">Connect your wallet to view your designs</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600">Loading your designs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white text-xs py-2 px-4 rounded hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎨</div>
          <p className="text-sm text-gray-600 mb-2">No designs found</p>
          <p className="text-xs text-gray-500">Create and save your first design to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">My Designs</h3>
          <span className="text-xs text-gray-500">({designs.length})</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            title="Refresh designs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Designs - Wide Cards (One per line) */}
      <div className="space-y-3">
        {designs.map((design) => (
          <DesignCard
            key={design.designId}
            design={design}
            onLoadDesign={onLoadDesign}
            onDeleteDesign={onDeleteDesign ? handleDeleteDesign : undefined}
            isLoading={isLoading}
            isWideCard={true}
          />
        ))}
      </div>

      {/* Load more button (if needed in future) */}
      {designs.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={handleRefresh}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            Refresh designs
          </button>
        </div>
      )}
    </div>
  );
};

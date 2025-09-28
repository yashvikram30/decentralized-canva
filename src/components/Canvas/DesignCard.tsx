import React, { useState } from 'react';
import { UserDesignDocument } from '../../services/mongoDBService';

interface DesignCardProps {
  design: UserDesignDocument;
  onLoadDesign: (designId: string) => Promise<void>;
  onDeleteDesign?: (designId: string) => Promise<void>;
  isLoading?: boolean;
  isWideCard?: boolean;
}

export const DesignCard: React.FC<DesignCardProps> = ({
  design,
  onLoadDesign,
  onDeleteDesign,
  isLoading = false,
  isWideCard = false
}) => {
  const [isLoadingDesign, setIsLoadingDesign] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLoadDesign = async () => {
    setIsLoadingDesign(true);
    try {
      await onLoadDesign(design.designId);
    } catch (error) {
      console.error('Failed to load design:', error);
    } finally {
      setIsLoadingDesign(false);
    }
  };

  const handleDeleteDesign = async () => {
    if (onDeleteDesign) {
      try {
        await onDeleteDesign(design.designId);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Failed to delete design:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateThumbnail = (canvasData: object) => {
    // Simple thumbnail generation - in a real app, you'd render the canvas
    // For now, we'll create a placeholder based on canvas size
    const data = canvasData as any;
    const width = data.width || 800;
    const height = data.height || 600;
    const elementCount = data.objects ? data.objects.length : 0;
    
    if (isWideCard) {
      return (
        <div 
          className="w-20 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-gray-200 flex-shrink-0"
          style={{ aspectRatio: width / height }}
        >
          <div className="text-center">
            <div className="text-lg mb-1">🎨</div>
            <div className="text-xs text-gray-600">{elementCount}</div>
          </div>
        </div>
      );
    }
    
    return (
      <div 
        className="w-full h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-gray-200"
        style={{ aspectRatio: width / height }}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">🎨</div>
          <div className="text-xs text-gray-600">{elementCount} elements</div>
        </div>
      </div>
    );
  };

  if (isWideCard) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-3">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
              <div className="text-5xl">🎨</div>
            </div>
          </div>

          {/* Name */}
          <h3 className="font-medium text-gray-900 text-sm mb-3 truncate w-full" title={design.name}>
            {design.name}
          </h3>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleLoadDesign}
              disabled={isLoading || isLoadingDesign}
              className="bg-blue-600 text-white text-xs py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoadingDesign ? (
                <div className="flex items-center justify-center gap-1">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Load to Canvas'
              )}
            </button>

            {onDeleteDesign && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-100 text-red-600 text-xs py-2 px-3 rounded hover:bg-red-200 transition-colors duration-200"
                title="Delete design"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow duration-200">
      {/* Thumbnail */}
      <div className="mb-3">
        {generateThumbnail(design.canvasData)}
      </div>

      {/* Design Info */}
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 text-sm truncate" title={design.name}>
          {design.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {formatDate(design.updatedAt)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">
            {design.metadata.canvasSize.width} × {design.metadata.canvasSize.height}
          </span>
          <span className="text-xs text-gray-400">
            • {design.metadata.elementCount} items
          </span>
        </div>
        {design.blobId && (
          <div className="mt-2">
            <div className="flex items-center gap-1 text-xs text-green-600">
              <span>🔗</span>
              <span className="truncate" title={`Walrus Blob ID: ${design.blobId}`}>
                {design.blobId.substring(0, 12)}...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleLoadDesign}
          disabled={isLoading || isLoadingDesign}
          className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoadingDesign ? (
            <div className="flex items-center justify-center gap-1">
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          ) : (
            'Load to Canvas'
          )}
        </button>

        {onDeleteDesign && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-100 text-red-600 text-xs py-2 px-3 rounded hover:bg-red-200 transition-colors duration-200"
            title="Delete design"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete Design
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to delete &quot;{design.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteDesign}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { Save, Upload, X, Loader2, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useWalrus } from '@/hooks/useWalrus';
import { useWalletService, useWalletSigner } from '@/services/walletSigner';
import { fabric } from '@/lib/fabric';

interface WalrusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: fabric.Canvas | null;
  onLoad?: (designData: any) => void;
  mode: 'save' | 'load';
}

export default function WalrusPopup({ isOpen, onClose, canvas, onLoad, mode }: WalrusPopupProps) {
  const [designName, setDesignName] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [loadBlobId, setLoadBlobId] = useState('');
  const [batchBlobIds, setBatchBlobIds] = useState('');
  const [loadedDesigns, setLoadedDesigns] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'batch'>('save');
  const [error, setError] = useState<string | null>(null);

  const { 
    store, 
    retrieve, 
    retrieveMultiple, 
    retrieveDesignWithAssets, 
    storeDesignWithAssets,
    testBlobId,
    isStoring, 
    isRetrieving, 
    isBatchLoading,
    isLoadingWithAssets,
    isEncrypting, 
    isDecrypting, 
    error: walrusError 
  } = useWalrus();
  const walletService = useWalletService();
  const walletSigner = useWalletSigner();

  const isConnected = walletService.isConnected;
  const address = walletService.address;
  const walletName = typeof walletService.walletName === 'string' ? walletService.walletName : 'Unknown Wallet';

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(mode);
      setError(null);
      setDesignName('');
      setLoadBlobId('');
      setBatchBlobIds('');
      setLoadedDesigns([]);
    }
  }, [isOpen, mode]);

  const handleSave = async () => {
    if (!canvas || !designName.trim()) return;

    try {
      setError(null);
      
      // Get canvas data
      const canvasData = canvas.toJSON();
      
      // Create metadata
      const metadata = {
        name: designName.trim(),
        created: new Date().toISOString(),
        encrypted: isEncrypted,
        walletAddress: address || '',
        walletName,
        version: '1.0.0',
        type: 'canvas-design',
        canvasSize: {
          width: canvas.getWidth(),
          height: canvas.getHeight()
        }
      };

      // Create blob data
      const blobData = {
        designData: canvasData,
        metadata
      };

      // Store to Walrus
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }
      
      // Ensure we have a valid address for encryption
      if (isEncrypted && (!address || typeof address !== 'string')) {
        console.error('❌ Encryption requires valid wallet address:', { address, isEncrypted });
        throw new Error('Valid wallet address is required for encryption');
      }
      
      // Debug logging for encryption
      if (isEncrypted) {
        console.log('🔐 Encryption Debug:', {
          address,
          addressType: typeof address,
          addressLength: address?.length,
          isConnected,
          walletName
        });
      }
      
      const result = await store(blobData, walletService as any, 1, {}, address || undefined);
      
      if (result.stored) {
        // Show success message with blob ID
        setError(`✅ Design saved successfully! Blob ID: ${result.blobId}`);
        setDesignName('');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(`❌ Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleLoad = async () => {
    if (!loadBlobId.trim()) return;

    try {
      setError(null);
      
      const result = await retrieve(loadBlobId.trim(), address || undefined);
      
      if (result.data && result.data.designData) {
        // Load the design into canvas
        if (onLoad) {
          onLoad(result.data.designData);
        }
        setError(`✅ Design loaded successfully!`);
        setLoadBlobId('');
      }
    } catch (err) {
      console.error('Load error:', err);
      setError(`❌ Load failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleBatchLoad = async () => {
    if (!batchBlobIds.trim()) return;

    try {
      setError(null);
      
      // Parse blob IDs
      const ids = batchBlobIds
        .split(/[,\n]/)
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (ids.length === 0) {
        setError('❌ Please enter at least one valid blob ID');
        return;
      }

      const results = await retrieveMultiple(ids, address || undefined);
      setLoadedDesigns(results);
      setError(`✅ Loaded ${results.length} designs successfully!`);
    } catch (err) {
      console.error('Batch load error:', err);
      setError(`❌ Batch load failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCopyBlobId = async (blobId: string) => {
    try {
      await navigator.clipboard.writeText(blobId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy blob ID:', error);
    }
  };

  const handleViewOnExplorer = (blobId: string) => {
    const explorerUrl = `https://suiexplorer.com/object/${blobId}?network=testnet`;
    window.open(explorerUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-full bg-white flex flex-col min-w-0 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {mode === 'save' ? 'Save to Walrus' : 'Load from Walrus'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0 min-w-0">
          <button
            onClick={() => setActiveTab('save')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'save'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Save Design
          </button>
          <button
            onClick={() => setActiveTab('load')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'load'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Load Design
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'batch'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Batch Load
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0 min-w-0 max-w-full">
          {/* Error Display */}
          {error && (
            <div className={cn(
              "mb-4 p-3 rounded-lg text-sm",
              error.startsWith('✅') 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            )}>
              {error}
            </div>
          )}

          {/* Save Tab */}
          {activeTab === 'save' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design Name
                </label>
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  placeholder="Enter design name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="encrypt"
                  checked={isEncrypted}
                  onChange={(e) => setIsEncrypted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="encrypt" className="text-sm text-gray-700">
                  Encrypt with Seal (Private)
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={isStoring || isEncrypting || !designName.trim() || !isConnected}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStoring || isEncrypting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>
                  {isEncrypting 
                    ? '🔐 Encrypting with Seal...' 
                    : isStoring 
                    ? '💾 Saving to Walrus...' 
                    : 'Save to Walrus'
                  }
                </span>
              </button>
            </div>
          )}

          {/* Load Tab */}
          {activeTab === 'load' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blob ID
                </label>
                <input
                  type="text"
                  value={loadBlobId}
                  onChange={(e) => setLoadBlobId(e.target.value)}
                  placeholder="Enter Walrus blob ID"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Paste the blob ID you received when saving a design
                </p>
              </div>

              <button
                onClick={handleLoad}
                disabled={isRetrieving || isDecrypting || !loadBlobId.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrieving || isDecrypting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                <span>
                  {isDecrypting 
                    ? '🔓 Decrypting with Seal...' 
                    : isRetrieving 
                    ? '📥 Loading from Walrus...' 
                    : 'Load from Walrus'
                  }
                </span>
              </button>
            </div>
          )}

          {/* Batch Load Tab */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blob IDs (one per line or comma-separated)
                </label>
                <textarea
                  value={batchBlobIds}
                  onChange={(e) => setBatchBlobIds(e.target.value)}
                  placeholder="Paste multiple Walrus blob IDs here&#10;One per line or separated by commas"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter multiple blob IDs to load them efficiently in batch
                </p>
              </div>

              <button
                onClick={handleBatchLoad}
                disabled={isBatchLoading || isDecrypting || !batchBlobIds.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBatchLoading || isDecrypting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>
                  {isDecrypting 
                    ? '🔓 Decrypting with Seal...' 
                    : isBatchLoading 
                    ? '📥 Batch loading from Walrus...' 
                    : 'Batch Load from Walrus'
                  }
                </span>
              </button>

              {/* Loaded Designs List */}
              {loadedDesigns.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Loaded Designs</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {loadedDesigns.map((design, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {design.data.metadata.name || `Design ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {design.blobId.slice(0, 8)}...{design.blobId.slice(-4)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleCopyBlobId(design.blobId)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy blob ID"
                          >
                            {copied ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleViewOnExplorer(design.blobId)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View on explorer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
}

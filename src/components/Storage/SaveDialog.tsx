'use client';

import React, { useState } from 'react';
import { fabric } from '@/lib/fabric';
import { Save, Loader2, Copy, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useWalrus } from '@/hooks/useWalrus';
import { suiSignerService } from '@/services/suiSigner';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: fabric.Canvas | null;
  onLoad?: (designData: any) => void;
}

export default function SaveDialog({ isOpen, onClose, canvas, onLoad }: SaveDialogProps) {
  const [designName, setDesignName] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [savedBlobId, setSavedBlobId] = useState('');
  const [loadBlobId, setLoadBlobId] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');
  const [signerStatus, setSignerStatus] = useState<'none' | 'generated' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);

  const { store, retrieve, isStoring, isRetrieving, error: walrusError } = useWalrus();

  const generateBlobId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `walrus_${timestamp}_${random}`;
  };

  const handleSave = async () => {
    if (!canvas || !designName.trim()) return;
    
    setError(null);
    
    try {
      // Ensure we have a signer
      if (!suiSignerService.hasSigner()) {
        const keypair = suiSignerService.generateKeypair();
        setSignerStatus('generated');
        
        // Request SUI from faucet for testnet
        try {
          await suiSignerService.requestFaucet();
        } catch (faucetError) {
          console.warn('Faucet request failed:', faucetError);
          // Continue anyway - user might have SUI already
        }
      }

      const signer = suiSignerService.getSigner();
      if (!signer) {
        throw new Error('Failed to create signer');
      }

      const designData = canvas.toJSON();
      
      const designToStore = {
        designData,
        metadata: {
          name: designName,
          created: new Date().toISOString(),
          encrypted: isEncrypted,
        }
      };
      
      // Store to Walrus
      const result = await store(designToStore, signer, 3); // 3 epochs
      setSavedBlobId(result.blobId);
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
        setDesignName('');
        setIsEncrypted(false);
        setSavedBlobId('');
        setSignerStatus('none');
      }, 3000);
      
    } catch (error) {
      console.error('Save failed:', error);
      setError(error instanceof Error ? error.message : 'Save failed');
      setSignerStatus('error');
    }
  };

  const handleLoad = async () => {
    if (!loadBlobId.trim()) return;
    
    setError(null);
    
    try {
      // Load from Walrus
      const result = await retrieve(loadBlobId);
      onLoad?.(result.data.designData);
      
      // Close modal
      onClose();
      setLoadBlobId('');
      
    } catch (error) {
      console.error('Load failed:', error);
      setError(error instanceof Error ? error.message : 'Load failed');
    }
  };

  const handleCopyBlobId = async () => {
    try {
      await navigator.clipboard.writeText(savedBlobId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Save className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Walrus Storage</h2>
              <p className="text-sm text-gray-500">Save and load designs on the decentralized network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
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
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {(error || walrusError) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Error</span>
              </div>
              <p className="mt-1 text-sm text-red-700">
                {error || walrusError}
              </p>
            </div>
          )}

          {/* Signer Status */}
          {signerStatus === 'generated' && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Wallet Generated</span>
              </div>
              <p className="mt-1 text-sm text-blue-700">
                A new wallet has been created and SUI requested from faucet for testnet.
              </p>
            </div>
          )}

          {activeTab === 'save' ? (
            <div className="space-y-4">
              {/* Success Message */}
              {savedBlobId && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Design Saved Successfully!</span>
                  </div>
                  <div className="text-sm text-green-700 mb-3">
                    Your design has been stored on the Walrus network.
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-mono">
                      {savedBlobId}
                    </code>
                    <button
                      onClick={handleCopyBlobId}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Save Form */}
              {!savedBlobId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Design Name
                    </label>
                    <input
                      type="text"
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                      placeholder="Enter a name for your design"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="encrypt"
                      checked={isEncrypted}
                      onChange={(e) => setIsEncrypted(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="encrypt" className="text-sm text-gray-700">
                      Encrypt design (recommended for private content)
                    </label>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isStoring || !designName.trim()}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStoring ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>
                      {isStoring ? '📦 Storing on Walrus network...' : 'Save to Walrus'}
                    </span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blob ID
                </label>
                <input
                  type="text"
                  value={loadBlobId}
                  onChange={(e) => setLoadBlobId(e.target.value)}
                  placeholder="Paste the Walrus blob ID here"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the blob ID you received when saving a design
                </p>
              </div>

              <button
                onClick={handleLoad}
                disabled={isRetrieving || !loadBlobId.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrieving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>
                  {isRetrieving ? '📥 Loading from Walrus...' : 'Load from Walrus'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

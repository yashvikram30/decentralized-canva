'use client';

import React, { useState } from 'react';
import { fabric } from '@/lib/fabric';
import { Save, Loader2, Copy, Check, X, AlertCircle, Wallet, Shield, Lock } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useWalrus } from '@/hooks/useWalrus';
import { useWalletService } from '@/services/walletSigner';
import WalletModal from '@/components/Wallet/WalletModal';

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
  const [error, setError] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const { store, retrieve, isStoring, isRetrieving, isEncrypting, isDecrypting, error: walrusError } = useWalrus();
  const walletService = useWalletService();

  const isConnected = walletService.isConnected;
  const address = walletService.address;
  const walletName = typeof walletService.walletName === 'string' ? walletService.walletName : 'Unknown Wallet';
  const walletType = walletService.currentWallet && 'name' in walletService.currentWallet ? 
    (walletService.currentWallet.name as string).toLowerCase().includes('slush') ? 'slush' :
    (walletService.currentWallet.name as string).toLowerCase().includes('sui wallet') ? 'sui-wallet' :
    (walletService.currentWallet.name as string).toLowerCase().includes('suiet') ? 'suiet' :
    (walletService.currentWallet.name as string).toLowerCase().includes('unsafe-burner') ? 'unsafe-burner' : 'slush' : 'slush';


  const handleSave = async () => {
    if (!canvas || !designName.trim()) return;
    
    setError(null);
    
    // Check if wallet is connected
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }
    
    try {
      // Use the connected wallet service for Walrus operations
      if (!isConnected) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // Check if wallet supports at least basic transaction signing
      if (!walletService.canSignTransaction) {
        throw new Error('Your wallet does not support transaction signing. Please try a different wallet.');
      }

      // Log the wallet address being used for Walrus operations
      console.log('Using connected wallet for Walrus operations:', address);

      const designData = canvas.toJSON();
      
      const designToStore = {
        designData,
        metadata: {
          name: designName,
          created: new Date().toISOString(),
          encrypted: isEncrypted,
          walletAddress: address || 'unknown',
          walletName: walletName || 'Unknown Wallet',
          walletType: walletType || 'unknown',
          version: '1.0.0',
          type: 'canva-design',
          canvasSize: {
            width: canvas.getWidth(),
            height: canvas.getHeight()
          }
        }
      };
      
      // Create a signer-compatible object for Walrus
      const walrusSigner = {
        getAddress: () => address!,
        toSuiAddress: () => address!,
        signPersonalMessage: walletService.signPersonalMessage,
        signTransaction: walletService.signTransaction,
        signAndExecuteTransaction: walletService.signAndExecuteTransaction,
      };

      // Store to Walrus with encryption if enabled
      const result = await store(
        designToStore, 
        walrusSigner as any, // Type assertion for Walrus compatibility
        1, // epochs (reduced for lower WAL requirement)
        { 'app': 'decentralized-canva', 'type': 'design' },
        address || undefined // userAddress for encryption
      );
      setSavedBlobId(result.blobId);
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
        setDesignName('');
        setIsEncrypted(false);
        setSavedBlobId('');
      }, 3000);
      
    } catch (error) {
      console.error('Save failed:', error);
      setError(error instanceof Error ? error.message : 'Save failed');
    }
  };

  const handleLoad = async () => {
    if (!loadBlobId.trim()) return;
    
    setError(null);
    
    try {
      // Load from Walrus with decryption if needed
      const result = await retrieve(loadBlobId, address || undefined);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-100"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto z-[10000]">
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

          {/* Wallet Status */}
          {!isConnected && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Wallet Required</span>
              </div>
              <p className="mt-1 text-sm text-yellow-700">
                You need to connect your wallet to save designs to Walrus storage.
              </p>
            </div>
          )}

          {isConnected && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Wallet Connected</span>
              </div>
              <p className="mt-1 text-sm text-green-700">
                Connected as: {address?.slice(0, 6)}...{address?.slice(-4)} ({walletName})
              </p>
              {!walletService.canSignAndExecute && walletService.canSignTransaction && (
                <p className="mt-1 text-xs text-blue-600">
                  ℹ️ Using fallback signing method (sign + execute)
                </p>
              )}
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

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="encrypt"
                        checked={isEncrypted}
                        onChange={(e) => setIsEncrypted(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="encrypt" className="text-sm text-gray-700 flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Encrypt design with Seal (recommended for private content)</span>
                      </label>
                    </div>
                    
                    {isEncrypted && (
                      <div className="ml-7 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Seal Encryption Enabled</span>
                        </div>
                        <div className="text-xs text-blue-700 space-y-1">
                          <p>• Your design will be encrypted using threshold encryption</p>
                          <p>• Only you can decrypt and access the design</p>
                          <p>• Access is controlled via Sui blockchain policies</p>
                          <p>• Multiple key servers ensure security and availability</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isStoring || isEncrypting || !designName.trim() || !isConnected}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStoring || isEncrypting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : !isConnected ? (
                      <Wallet className="w-5 h-5" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>
                      {isEncrypting 
                        ? '🔐 Encrypting with Seal...' 
                        : isStoring 
                        ? '📦 Storing on Walrus network...' 
                        : !isConnected 
                        ? 'Connect Wallet to Save'
                        : 'Save to Walrus'
                      }
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
                disabled={isRetrieving || isDecrypting || !loadBlobId.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrieving || isDecrypting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
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
        </div>
      </div>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </div>
  );
}

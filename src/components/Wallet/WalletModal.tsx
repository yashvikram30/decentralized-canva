'use client';

import React from 'react';
import { Wallet, X, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/utils/helpers';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, isConnecting, error } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
      onClose();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleInstallWallet = () => {
    window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank');
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
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Connect Wallet</h2>
              <p className="text-sm text-gray-500">Connect your wallet to save designs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Connection Error</span>
              </div>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Wallet Options */}
          <div className="space-y-4">
            {/* Sui Wallet */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Sui Wallet</h3>
                    <p className="text-sm text-gray-500">Official Sui wallet extension</p>
                  </div>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isConnecting
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>

            {/* Install Wallet Prompt */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Don&apos;t have Sui Wallet?</h3>
                  <p className="text-sm text-gray-500">Install the official Sui Wallet extension</p>
                </div>
                <button
                  onClick={handleInstallWallet}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Install</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Why connect a wallet?</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Save designs to decentralized storage</li>
                  <li>• Maintain control of your private keys</li>
                  <li>• Sign transactions securely</li>
                  <li>• Access your designs from anywhere</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-800">
                <strong>Security:</strong> Your wallet connection is only used for signing transactions. 
                We never have access to your private keys or funds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

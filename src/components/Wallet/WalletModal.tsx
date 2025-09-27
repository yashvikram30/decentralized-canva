'use client';

import React from 'react';
import { Wallet, X, CheckCircle, AlertCircle } from 'lucide-react';
import { ConnectButton } from '@mysten/dapp-kit';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  // No error state needed since dApp Kit handles errors internally

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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
              <p className="text-sm text-gray-600">Connect your wallet to save designs to decentralized storage</p>
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
          {/* dApp Kit ConnectButton */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Wallet</h3>
            
            {/* Custom styled ConnectButton */}
            <div className="flex justify-center">
              <ConnectButton 
                connectText="Connect Wallet"
                className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !text-white !px-8 !py-3 !rounded-lg !font-semibold !shadow-lg hover:!shadow-xl !transform hover:!scale-105 !transition-all !duration-200"
              />
            </div>
          </div>

          {/* Information */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-3 text-lg">Why connect a wallet?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Save designs to decentralized storage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Maintain control of your private keys</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Sign transactions securely</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Access your designs from anywhere</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-900 mb-2">Security Notice</h4>
                <p className="text-sm text-yellow-800">
                  Your wallet connection is only used for signing transactions. 
                  We never have access to your private keys or funds. Always verify 
                  transactions before signing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
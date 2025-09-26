'use client';

import React, { useState } from 'react';
import { Wallet, CheckCircle, XCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/utils/helpers';

interface WalletTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletTestPanel({ isOpen, onClose }: WalletTestPanelProps) {
  const { isConnected, address, balance, connect, disconnect, refreshBalance, error } = useWallet();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const runWalletTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    const results: string[] = [];
    
    try {
      // Test 1: Check if wallet is available
      results.push('🧪 Testing wallet availability...');
      if (typeof window !== 'undefined' && (window as any).suiWallet) {
        results.push('✅ Sui Wallet extension detected');
      } else {
        results.push('❌ Sui Wallet extension not found');
      }
      
      // Test 2: Test connection
      if (!isConnected) {
        results.push('🔌 Testing wallet connection...');
        try {
          await connect();
          results.push('✅ Wallet connected successfully');
        } catch (error) {
          results.push(`❌ Wallet connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        results.push('✅ Wallet already connected');
      }
      
      // Test 3: Test balance refresh
      if (isConnected) {
        results.push('💰 Testing balance refresh...');
        try {
          await refreshBalance();
          results.push(`✅ Balance refreshed: ${balance} SUI`);
        } catch (error) {
          results.push(`❌ Balance refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Test 4: Test wallet info
      if (isConnected && address) {
        results.push('📋 Testing wallet info...');
        results.push(`✅ Address: ${address.slice(0, 6)}...${address.slice(-4)}`);
        results.push(`✅ Balance: ${balance} SUI`);
      }
      
    } catch (error) {
      results.push(`❌ Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
      setTestResults(results);
    }
  };

  const handleViewOnExplorer = () => {
    if (!address) return;
    const explorerUrl = `https://suiexplorer.com/address/${address}?network=testnet`;
    window.open(explorerUrl, '_blank');
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
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Wallet Integration Test</h2>
              <p className="text-sm text-gray-500">Test wallet connection and functionality</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Current Status</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  isConnected ? "text-green-800" : "text-red-800"
                )}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              
              {address && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Address:</span>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </code>
                  <button
                    onClick={handleViewOnExplorer}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title="View on explorer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {balance && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <span className="text-sm font-medium">{balance} SUI</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Test Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={runWalletTests}
                disabled={isTesting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span>{isTesting ? 'Running Tests...' : 'Run Wallet Tests'}</span>
              </button>
              
              {isConnected && (
                <button
                  onClick={disconnect}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              )}
              
              {!isConnected && (
                <button
                  onClick={connect}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {testResults.length === 0 && !isTesting && (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
              <p className="text-gray-600 mb-4">
                Click &quot;Run Wallet Tests&quot; to test wallet integration functionality.
              </p>
              <div className="text-sm text-gray-500">
                <p>• Tests wallet extension detection</p>
                <p>• Tests wallet connection flow</p>
                <p>• Tests balance refresh functionality</p>
                <p>• Tests wallet information display</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

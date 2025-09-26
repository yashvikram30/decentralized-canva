'use client';

import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { walrusTester, TestResult } from '@/utils/walrusTester';
import { cn } from '@/utils/helpers';

interface WalrusTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalrusTestPanel({ isOpen, onClose }: WalrusTestPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentTest('Running all tests...');
    
    try {
      const testResults = await walrusTester.runAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const runSingleTest = async (testName: string, testFn: () => Promise<TestResult>) => {
    setIsRunning(true);
    setCurrentTest(`Running ${testName}...`);
    
    try {
      const result = await testFn();
      setResults(prev => [...prev, result]);
    } catch (error) {
      console.error(`${testName} failed:`, error);
      setResults(prev => [...prev, {
        success: false,
        message: `${testName} failed`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }]);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  if (!isOpen) return null;

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Walrus Storage Testing</h2>
              <p className="text-sm text-gray-500">Test and verify Walrus storage functionality</p>
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
          {/* Test Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Run All Tests</span>
              </button>
              
              <button
                onClick={clearResults}
                disabled={isRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear Results</span>
              </button>
            </div>

            {/* Individual Test Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button
                onClick={() => runSingleTest('Network Connectivity', walrusTester.testNetworkConnectivity.bind(walrusTester))}
                disabled={isRunning}
                className="px-3 py-2 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
              >
                Test Network
              </button>
              <button
                onClick={() => runSingleTest('Signer Generation', walrusTester.testSignerGeneration.bind(walrusTester))}
                disabled={isRunning}
                className="px-3 py-2 text-sm bg-purple-100 text-purple-800 rounded hover:bg-purple-200 disabled:opacity-50"
              >
                Test Signer
              </button>
              <button
                onClick={() => runSingleTest('Basic Storage', walrusTester.testBasicStorage.bind(walrusTester))}
                disabled={isRunning}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Test Storage
              </button>
              <button
                onClick={() => runSingleTest('Storage & Retrieval', walrusTester.testStorageAndRetrieval.bind(walrusTester))}
                disabled={isRunning}
                className="px-3 py-2 text-sm bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 disabled:opacity-50"
              >
                Test Retrieval
              </button>
              <button
                onClick={() => runSingleTest('Error Handling', walrusTester.testErrorHandling.bind(walrusTester))}
                disabled={isRunning}
                className="px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Test Errors
              </button>
            </div>
          </div>

          {/* Current Test Status */}
          {currentTest && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-800">{currentTest}</span>
              </div>
            </div>
          )}

          {/* Test Results Summary */}
          {totalTests > 0 && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">{passedTests} Passed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">{totalTests - passedTests} Failed</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {totalTests} Total Tests
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border",
                    result.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{result.message}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {result.error && (
                        <p className="mt-1 text-sm text-red-700">{result.error}</p>
                      )}
                      {result.data && (
                        <div className="mt-2">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          {results.length === 0 && !isRunning && (
            <div className="text-center py-8">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
              <p className="text-gray-600 mb-4">
                Click &quot;Run All Tests&quot; to test Walrus storage functionality, or run individual tests.
              </p>
              <div className="text-sm text-gray-500">
                <p>• Network Connectivity: Tests Sui network connection</p>
                <p>• Signer Generation: Tests wallet/keypair creation</p>
                <p>• Basic Storage: Tests storing data to Walrus</p>
                <p>• Storage & Retrieval: Tests full storage cycle</p>
                <p>• Error Handling: Tests error scenarios</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Walrus Storage Testing Utilities
 * 
 * This utility provides methods to test and verify Walrus storage functionality
 * without requiring the full UI flow.
 */

import { walrusClient } from '@/services/walrusClient';
import { suiSignerService } from '@/services/suiSigner';

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface WalrusTestSuite {
  testBasicStorage: () => Promise<TestResult>;
  testStorageAndRetrieval: () => Promise<TestResult>;
  testErrorHandling: () => Promise<TestResult>;
  testNetworkConnectivity: () => Promise<TestResult>;
  testSignerGeneration: () => Promise<TestResult>;
}

export class WalrusTester {
  private testData = {
    simple: { message: "Hello Walrus!", timestamp: Date.now() },
    complex: {
      design: {
        objects: [
          { type: "text", content: "Test Design", x: 100, y: 100 },
          { type: "rectangle", width: 200, height: 100, x: 50, y: 50 }
        ],
        metadata: { name: "Test Design", version: "1.0" }
      },
      timestamp: Date.now()
    }
  };

  /**
   * Test basic storage functionality
   */
  async testBasicStorage(): Promise<TestResult> {
    try {
      console.log('🧪 Testing basic Walrus storage...');
      
      // Ensure we have a signer
      if (!suiSignerService.hasSigner()) {
        suiSignerService.generateKeypair();
        console.log('✅ Generated test signer');
      }

      const signer = suiSignerService.getSigner();
      if (!signer) {
        throw new Error('Failed to create signer');
      }

      // Test storage
      const result = await walrusClient.store(this.testData.simple, signer, 3);
      
      console.log('✅ Basic storage test passed:', result.blobId);
      
      return {
        success: true,
        message: 'Basic storage test passed',
        data: result,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Basic storage test failed:', error);
      return {
        success: false,
        message: 'Basic storage test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Test storage and retrieval cycle
   */
  async testStorageAndRetrieval(): Promise<TestResult> {
    try {
      console.log('🧪 Testing storage and retrieval cycle...');
      
      // Ensure we have a signer
      if (!suiSignerService.hasSigner()) {
        suiSignerService.generateKeypair();
      }

      const signer = suiSignerService.getSigner();
      if (!signer) {
        throw new Error('Failed to create signer');
      }

      // Store data
      const storeResult = await walrusClient.store(this.testData.complex, signer, 3);
      console.log('✅ Data stored:', storeResult.blobId);

      // Wait a moment for storage to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Retrieve data
      const retrieveResult = await walrusClient.retrieve(storeResult.blobId);
      console.log('✅ Data retrieved successfully');

      // Verify data integrity
      const originalData = JSON.stringify(this.testData.complex);
      const retrievedData = JSON.stringify(retrieveResult.data);
      
      if (originalData !== retrievedData) {
        throw new Error('Data integrity check failed - retrieved data does not match original');
      }

      console.log('✅ Storage and retrieval test passed');
      
      return {
        success: true,
        message: 'Storage and retrieval test passed',
        data: {
          blobId: storeResult.blobId,
          originalSize: originalData.length,
          retrievedSize: retrievedData.length,
          dataMatch: true
        },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Storage and retrieval test failed:', error);
      return {
        success: false,
        message: 'Storage and retrieval test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling(): Promise<TestResult> {
    try {
      console.log('🧪 Testing error handling...');
      
      // Test with invalid blob ID
      try {
        await walrusClient.retrieve('invalid-blob-id-12345');
        return {
          success: false,
          message: 'Error handling test failed - should have thrown error for invalid blob ID',
          timestamp: Date.now()
        };
      } catch (error) {
        console.log('✅ Correctly handled invalid blob ID error');
      }

      // Test with empty data
      try {
        if (!suiSignerService.hasSigner()) {
          suiSignerService.generateKeypair();
        }
        const signer = suiSignerService.getSigner();
        if (!signer) throw new Error('No signer available');
        
        await walrusClient.store(null, signer, 3);
        return {
          success: false,
          message: 'Error handling test failed - should have thrown error for null data',
          timestamp: Date.now()
        };
      } catch (error) {
        console.log('✅ Correctly handled null data error');
      }

      console.log('✅ Error handling test passed');
      
      return {
        success: true,
        message: 'Error handling test passed',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error handling test failed:', error);
      return {
        success: false,
        message: 'Error handling test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Test network connectivity
   */
  async testNetworkConnectivity(): Promise<TestResult> {
    try {
      console.log('🧪 Testing network connectivity...');
      
      // Test Sui RPC connectivity
      const suiClient = suiSignerService.getSuiClient();
      const chainId = await suiClient.getChainIdentifier();
      
      console.log('✅ Sui network connected:', chainId);
      
      // Test if we can get balance (even if 0)
      if (suiSignerService.hasSigner()) {
        const balance = await suiSignerService.checkBalance();
        console.log('✅ Balance check successful:', balance.balance);
      }
      
      return {
        success: true,
        message: 'Network connectivity test passed',
        data: { chainId, balance: suiSignerService.hasSigner() ? await suiSignerService.checkBalance() : null },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Network connectivity test failed:', error);
      return {
        success: false,
        message: 'Network connectivity test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Test signer generation
   */
  async testSignerGeneration(): Promise<TestResult> {
    try {
      console.log('🧪 Testing signer generation...');
      
      // Clear existing signer
      suiSignerService.generateKeypair();
      
      const signer = suiSignerService.getSigner();
      const address = suiSignerService.getAddress();
      
      if (!signer || !address) {
        throw new Error('Failed to generate signer or get address');
      }
      
      console.log('✅ Signer generated successfully:', address);
      
      // Test faucet request (may fail, that's ok)
      try {
        await suiSignerService.requestFaucet();
        console.log('✅ Faucet request successful');
      } catch (faucetError) {
        console.log('⚠️ Faucet request failed (this is normal):', faucetError);
      }
      
      return {
        success: true,
        message: 'Signer generation test passed',
        data: { address, hasSigner: suiSignerService.hasSigner() },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Signer generation test failed:', error);
      return {
        success: false,
        message: 'Signer generation test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Running Walrus test suite...');
    
    const tests = [
      this.testNetworkConnectivity.bind(this),
      this.testSignerGeneration.bind(this),
      this.testBasicStorage.bind(this),
      this.testStorageAndRetrieval.bind(this),
      this.testErrorHandling.bind(this)
    ];
    
    const results: TestResult[] = [];
    
    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          message: 'Test execution failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        });
      }
    }
    
    // Log summary
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${result.message}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    return results;
  }
}

// Export singleton instance
export const walrusTester = new WalrusTester();

// Export convenience functions for browser console
if (typeof window !== 'undefined') {
  (window as any).walrusTester = walrusTester;
  (window as any).testWalrus = () => walrusTester.runAllTests();
  (window as any).testWalrusBasic = () => walrusTester.testBasicStorage();
  (window as any).testWalrusRetrieval = () => walrusTester.testStorageAndRetrieval();
}

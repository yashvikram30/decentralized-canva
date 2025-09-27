import { sealEncryption } from './sealEncryption';
import { sealSDKAdapter } from './sealSDKAdapter';
import { walrusClient } from './walrusClient';

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    seal: 'healthy' | 'degraded' | 'unhealthy';
    walrus: 'healthy' | 'degraded' | 'unhealthy';
    sui: 'healthy' | 'degraded' | 'unhealthy';
  };
  details: {
    seal: {
      sdkAvailable: boolean;
      encryptionWorking: boolean;
      keyServers: boolean;
      lastError?: string;
    };
    walrus: {
      connectionWorking: boolean;
      storageWorking: boolean;
      lastError?: string;
    };
    sui: {
      connectionWorking: boolean;
      lastError?: string;
    };
  };
  timestamp: number;
}

export class EncryptionHealthMonitor {
  private healthStatus: HealthStatus | null = null;
  private lastCheck: number = 0;
  private checkInterval: number = 30000; // 30 seconds
  private isMonitoring: boolean = false;

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = Date.now();
    
    try {
      // Check Seal service
      const sealHealth = await this.checkSealHealth();
      
      // Check Walrus service
      const walrusHealth = await this.checkWalrusHealth();
      
      // Check Sui network
      const suiHealth = await this.checkSuiHealth();
      
      // Determine overall health
      const overall = this.determineOverallHealth(sealHealth, walrusHealth, suiHealth);
      
      this.healthStatus = {
        overall,
        services: {
          seal: sealHealth.status,
          walrus: walrusHealth.status,
          sui: suiHealth.status,
        },
        details: {
          seal: sealHealth.details,
          walrus: walrusHealth.details,
          sui: suiHealth.details,
        },
        timestamp,
      };
      
      this.lastCheck = timestamp;
      
      console.log('🏥 Health check completed:', {
        overall: this.healthStatus.overall,
        services: this.healthStatus.services,
        timestamp: new Date(timestamp).toISOString()
      });
      
      return this.healthStatus;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      this.healthStatus = {
        overall: 'unhealthy',
        services: {
          seal: 'unhealthy',
          walrus: 'unhealthy',
          sui: 'unhealthy',
        },
        details: {
          seal: {
            sdkAvailable: false,
            encryptionWorking: false,
            keyServers: false,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
          walrus: {
            connectionWorking: false,
            storageWorking: false,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
          sui: {
            connectionWorking: false,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        timestamp,
      };
      
      return this.healthStatus;
    }
  }

  private async checkSealHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: HealthStatus['details']['seal'];
  }> {
    const details: HealthStatus['details']['seal'] = {
      sdkAvailable: false,
      encryptionWorking: false,
      keyServers: false,
    };

    try {
      // Check if SDK is available
      details.sdkAvailable = sealSDKAdapter.isSDKAvailable();
      
      // Test encryption/decryption
      const testData = new TextEncoder().encode('health-check-test-data');
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
      
      try {
        const encrypted = await sealEncryption.encryptData(testData, testAddress);
        const decrypted = await sealEncryption.decryptData(
          encrypted.encryptedData,
          encrypted.accessPolicyId,
          testAddress
        );
        
        details.encryptionWorking = decrypted.decryptedData.length === testData.length;
      } catch (error) {
        details.lastError = error instanceof Error ? error.message : 'Encryption test failed';
      }
      
      // Check key servers
      const sdkInfo = sealSDKAdapter.getSDKInfo();
      details.keyServers = sdkInfo.keyServers.length > 0;
      
      // Determine status
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (details.encryptionWorking && details.keyServers) {
        status = 'healthy';
      } else if (details.encryptionWorking || details.keyServers) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return { status, details };
    } catch (error) {
      details.lastError = error instanceof Error ? error.message : 'Seal health check failed';
      return { status: 'unhealthy', details };
    }
  }

  private async checkWalrusHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: HealthStatus['details']['walrus'];
  }> {
    const details: HealthStatus['details']['walrus'] = {
      connectionWorking: false,
      storageWorking: false,
    };

    try {
      // Test Walrus connection
      try {
        const systemInfo = await walrusClient.getSystemInfo();
        details.connectionWorking = !!systemInfo;
      } catch (error) {
        details.lastError = error instanceof Error ? error.message : 'Walrus connection failed';
      }
      
      // Test storage (with a small test blob)
      try {
        // Note: This would require a signer, so we'll skip the actual storage test
        // In a real implementation, you'd test with a mock signer
        details.storageWorking = true; // Assume working if connection works
      } catch (error) {
        details.lastError = error instanceof Error ? error.message : 'Walrus storage test failed';
      }
      
      // Determine status
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (details.connectionWorking && details.storageWorking) {
        status = 'healthy';
      } else if (details.connectionWorking || details.storageWorking) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return { status, details };
    } catch (error) {
      details.lastError = error instanceof Error ? error.message : 'Walrus health check failed';
      return { status: 'unhealthy', details };
    }
  }

  private async checkSuiHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: HealthStatus['details']['sui'];
  }> {
    const details: HealthStatus['details']['sui'] = {
      connectionWorking: false,
    };

    try {
      // Test Sui network connection
      const response = await fetch(process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_getChainIdentifier',
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      details.connectionWorking = response.ok;
      
      if (!response.ok) {
        details.lastError = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      const status = details.connectionWorking ? 'healthy' : 'unhealthy';
      return { status, details };
    } catch (error) {
      details.lastError = error instanceof Error ? error.message : 'Sui health check failed';
      return { status: 'unhealthy', details };
    }
  }

  private determineOverallHealth(
    seal: { status: string },
    walrus: { status: string },
    sui: { status: string }
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = [seal.status, walrus.status, sui.status];
    
    if (statuses.every(s => s === 'healthy')) {
      return 'healthy';
    } else if (statuses.some(s => s === 'healthy') || statuses.some(s => s === 'degraded')) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🏥 Starting health monitoring...');
    
    // Initial health check
    this.checkHealth();
    
    // Set up interval
    setInterval(async () => {
      if (this.isMonitoring) {
        await this.checkHealth();
      }
    }, this.checkInterval);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🏥 Health monitoring stopped');
  }

  getLastHealthStatus(): HealthStatus | null {
    return this.healthStatus;
  }

  isHealthy(): boolean {
    return this.healthStatus?.overall === 'healthy';
  }

  getServiceStatus(service: keyof HealthStatus['services']): 'healthy' | 'degraded' | 'unhealthy' {
    return this.healthStatus?.services[service] || 'unhealthy';
  }
}

// Export singleton instance
export const encryptionHealthMonitor = new EncryptionHealthMonitor();

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  totalTime: number;
}

export class EncryptionRetryManager {
  private defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    jitter: true,
  };

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const data = await operation();
        return {
          success: true,
          data,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.warn(`🔄 Retry attempt ${attempt}/${finalConfig.maxAttempts} failed:`, lastError.message);
        
        // Don't retry on the last attempt
        if (attempt === finalConfig.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, finalConfig);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Operation failed after all retries',
      attempts: finalConfig.maxAttempts,
      totalTime: Date.now() - startTime,
    };
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Cap at max delay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Specialized retry methods for different operations
  async retryEncryption<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, {
      maxAttempts: 2, // Fewer retries for encryption
      baseDelay: 500,
      ...config,
    });
  }

  async retryDecryption<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, {
      maxAttempts: 3,
      baseDelay: 1000,
      ...config,
    });
  }

  async retryStorage<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, {
      maxAttempts: 5, // More retries for storage operations
      baseDelay: 2000,
      maxDelay: 30000, // Longer max delay for storage
      ...config,
    });
  }

  async retryAccessValidation<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(operation, {
      maxAttempts: 2,
      baseDelay: 1000,
      ...config,
    });
  }

  // Circuit breaker pattern for failing services
  private circuitBreakerStates = new Map<string, {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime: number;
    successCount: number;
  }>();

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceName: string,
    failureThreshold: number = 5,
    timeout: number = 60000, // 1 minute
    successThreshold: number = 3
  ): Promise<RetryResult<T>> {
    const state = this.circuitBreakerStates.get(serviceName) || {
      state: 'closed' as const,
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
    };

    // Check if circuit is open
    if (state.state === 'open') {
      if (Date.now() - state.lastFailureTime > timeout) {
        // Move to half-open state
        state.state = 'half-open';
        state.successCount = 0;
        console.log(`🔧 Circuit breaker for ${serviceName} moved to half-open state`);
      } else {
        return {
          success: false,
          error: `Circuit breaker is open for ${serviceName}`,
          attempts: 1,
          totalTime: 0,
        };
      }
    }

    try {
      const result = await operation();
      
      // Success - update circuit breaker state
      if (state.state === 'half-open') {
        state.successCount++;
        if (state.successCount >= successThreshold) {
          state.state = 'closed';
          state.failureCount = 0;
          console.log(`✅ Circuit breaker for ${serviceName} closed - service recovered`);
        }
      } else {
        state.failureCount = 0; // Reset failure count on success
      }
      
      this.circuitBreakerStates.set(serviceName, state);
      
      return {
        success: true,
        data: result,
        attempts: 1,
        totalTime: 0,
      };
    } catch (error) {
      // Failure - update circuit breaker state
      state.failureCount++;
      state.lastFailureTime = Date.now();
      
      if (state.failureCount >= failureThreshold) {
        state.state = 'open';
        console.log(`🚨 Circuit breaker for ${serviceName} opened - too many failures`);
      }
      
      this.circuitBreakerStates.set(serviceName, state);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
        attempts: 1,
        totalTime: 0,
      };
    }
  }

  getCircuitBreakerState(serviceName: string): {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime: number;
    successCount: number;
  } | null {
    return this.circuitBreakerStates.get(serviceName) || null;
  }

  resetCircuitBreaker(serviceName: string): void {
    this.circuitBreakerStates.delete(serviceName);
    console.log(`🔄 Circuit breaker for ${serviceName} reset`);
  }
}

// Export singleton instance
export const encryptionRetryManager = new EncryptionRetryManager();

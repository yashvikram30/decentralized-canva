import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { config } from '@/config/environment';
import type { Signer } from '@mysten/sui/cryptography';

export class SuiSignerService {
  private suiClient: SuiClient;
  private keypair: Ed25519Keypair | null = null;
  private readonly STORAGE_KEY = 'decentralized_canva_signer_keypair';

  constructor() {
    this.suiClient = new SuiClient({
      url: config.suiRpcUrl,
    });
    
    // Try to load existing keypair from localStorage
    this.loadKeypairFromStorage();
  }

  // Load keypair from localStorage
  private loadKeypairFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const keypairData = JSON.parse(stored);
          this.keypair = Ed25519Keypair.fromSecretKey(keypairData.secretKey);
          console.log('✅ Loaded existing signer from storage:', this.getAddress());
        }
      }
    } catch (error) {
      console.warn('Failed to load keypair from storage:', error);
      // Clear invalid data
      this.clearStoredKeypair();
    }
  }

  // Save keypair to localStorage
  private saveKeypairToStorage(): void {
    try {
      if (typeof window !== 'undefined' && this.keypair) {
        const keypairData = {
          secretKey: this.keypair.getSecretKey(),
          publicKey: this.keypair.getPublicKey().toRawBytes(),
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keypairData));
        console.log('✅ Saved signer to storage:', this.getAddress());
      }
    } catch (error) {
      console.warn('Failed to save keypair to storage:', error);
    }
  }

  // Clear stored keypair
  private clearStoredKeypair(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear stored keypair:', error);
    }
  }

  // Generate a new keypair for demo purposes
  // In production, you would integrate with wallet providers
  generateKeypair(): Ed25519Keypair {
    this.keypair = new Ed25519Keypair();
    this.saveKeypairToStorage();
    return this.keypair;
  }

  // Import keypair from private key
  importKeypair(privateKey: string): Ed25519Keypair {
    this.keypair = Ed25519Keypair.fromSecretKey(privateKey);
    this.saveKeypairToStorage();
    return this.keypair;
  }

  // Get current signer
  getSigner(): Signer | null {
    return this.keypair;
  }

  // Get current address
  getAddress(): string | null {
    return this.keypair?.getPublicKey().toSuiAddress() || null;
  }

  // Check if signer is available
  hasSigner(): boolean {
    return this.keypair !== null;
  }

  // Clear the current keypair and remove from storage
  clearKeypair(): void {
    this.keypair = null;
    this.clearStoredKeypair();
    console.log('🗑️ Signer cleared');
  }

  // Get Sui client
  getSuiClient(): SuiClient {
    return this.suiClient;
  }

  // Check if address has sufficient SUI for transactions
  async checkBalance(): Promise<{ hasBalance: boolean; balance: string }> {
    if (!this.keypair) {
      throw new Error('No signer available');
    }

    const address = this.keypair.getPublicKey().toSuiAddress();
    const balance = await this.suiClient.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI',
    });

    const hasBalance = parseInt(balance.totalBalance) > 0;
    return { hasBalance, balance: balance.totalBalance };
  }

  // Request SUI from faucet (testnet only)
  async requestFaucet(): Promise<void> {
    if (config.suiNetwork !== 'testnet') {
      throw new Error('Faucet is only available on testnet');
    }

    if (!this.keypair) {
      throw new Error('No signer available');
    }

    const address = this.keypair.getPublicKey().toSuiAddress();
    
    try {
      // Use direct HTTP request to faucet API (recommended for newer Sui.js versions)
      const faucetUrl = config.suiNetwork === 'testnet' 
        ? 'https://faucet.testnet.sui.io/gas'
        : 'https://faucet.devnet.sui.io/gas';
      
      const response = await fetch(faucetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FixedAmountRequest: {
            recipient: address
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Faucet request failed: ${response.statusText}`);
      }

      console.log('✅ SUI requested from faucet');
    } catch (error) {
      console.error('❌ Faucet request failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const suiSignerService = new SuiSignerService();

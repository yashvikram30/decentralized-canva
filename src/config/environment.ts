// Environment configuration for WalrusCanvas AI
export const config = {
  // AI Services (Server-side only for security)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  
  // Sui Network Configuration (Walrus uses Sui network)
  suiNetwork: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
  suiRpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io',
  
  // Walrus Configuration
  walrusWasmUrl: process.env.NEXT_PUBLIC_WALRUS_WASM_URL || 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
  
  // Mock Seal Configuration (for development)
  sealEnabled: process.env.NEXT_PUBLIC_SEAL_ENABLED === 'true',
  encryptionMode: process.env.NEXT_PUBLIC_ENCRYPTION_MODE || 'mock',
} as const;

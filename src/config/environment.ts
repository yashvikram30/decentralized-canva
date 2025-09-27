// Environment configuration for WalrusCanvas AI
export const config = {
  // AI Services (Server-side only for security)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  
  // Groq API Configuration (alternative to OpenAI)
  groqApiKey: process.env.GROQ_API_KEY || '',
  useGroq: process.env.USE_GROQ === 'true',
  
  // Stability AI Configuration (for image generation)
  stabilityApiKey: process.env.STABILITY_API_KEY || '',
  useStabilityAI: process.env.USE_STABILITY_AI === 'true',
  
  // Sui Network Configuration (Walrus uses Sui network)
  suiNetwork: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
  suiRpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io',
  
  // Walrus Configuration
  walrusWasmUrl: process.env.NEXT_PUBLIC_WALRUS_WASM_URL || 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
  walrusUploadRelayUrl: process.env.NEXT_PUBLIC_WALRUS_UPLOAD_RELAY_URL || 'https://upload-relay.testnet.walrus.space',
  
  // Seal Configuration
  sealEnabled: process.env.NEXT_PUBLIC_SEAL_ENABLED === 'true',
  sealKeyServers: process.env.NEXT_PUBLIC_SEAL_KEY_SERVERS?.split(',') || [
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8'
  ],
  sealThreshold: parseInt(process.env.NEXT_PUBLIC_SEAL_THRESHOLD || '2'),
  sealAccessPolicyId: process.env.NEXT_PUBLIC_SEAL_ACCESS_POLICY_ID || '',
  
  // Contract Configuration
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x811bc4f1adb18ba74c63a18d9924e5a90c8e07c889bad67471de2218b17a6539',
  registryId: process.env.NEXT_PUBLIC_REGISTRY_ID || '0xf97923d580f225dd879eac669fa9225e74df3c94454afac70d1b5636b7d05425',
  
  // Encryption Configuration
  encryptionMode: process.env.NEXT_PUBLIC_ENCRYPTION_MODE || 'seal', // 'seal' | 'mock' | 'none'
  enableClientSideEncryption: process.env.NEXT_PUBLIC_ENABLE_CLIENT_ENCRYPTION !== 'false',
} as const;

// Validate required environment variables
export function validateEnvironment() {
  const errors: string[] = [];
  
  // Check for at least one AI API key
  if (!config.openaiApiKey && !config.groqApiKey) {
    errors.push('At least one AI API key is required. Please set either OPENAI_API_KEY or GROQ_API_KEY in your environment variables.');
  }
  
  // Check for image generation API key
  if (!config.openaiApiKey && !config.stabilityApiKey) {
    errors.push('Image generation requires either OPENAI_API_KEY or STABILITY_API_KEY. Please set one of these in your environment variables.');
  }
  
  // If using Groq, check if image generation API key is available
  if (config.useGroq && !config.openaiApiKey && !config.stabilityApiKey) {
    console.warn('Warning: Using Groq for text generation but no image generation API key found. Image generation will be disabled.');
  }
  
  // Check for required Sui network configuration
  if (!config.suiNetwork) {
    errors.push('SUI_NETWORK environment variable is required.');
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

// Validate environment on import (only in server-side context)
if (typeof window === 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    // Don't throw in production to avoid breaking the app
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }
}

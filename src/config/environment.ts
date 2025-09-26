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
  
  // Mock Seal Configuration (for development)
  sealEnabled: process.env.NEXT_PUBLIC_SEAL_ENABLED === 'true',
  encryptionMode: process.env.NEXT_PUBLIC_ENCRYPTION_MODE || 'mock',
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

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up WalrusCanvas AI...\n');

// Create .env.local file if it doesn't exist
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  const envContent = `# AI Services
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_here
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_claude_key_here

# Walrus Configuration  
NEXT_PUBLIC_WALRUS_ENDPOINT=https://walrus-testnet.mystenlabs.com
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher-testnet.walrus.space

# Sui Network
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io

# Mock Seal Configuration (for development)
NEXT_PUBLIC_SEAL_ENABLED=true
NEXT_PUBLIC_ENCRYPTION_MODE=mock
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local file already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Add your OpenAI API key to .env.local');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:3000');
console.log('\n🎨 Happy designing with WalrusCanvas AI!');

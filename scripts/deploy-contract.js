#!/usr/bin/env node

/**
 * Contract Deployment Script
 * 
 * This script deploys the design package contract to Sui testnet/mainnet
 * and outputs the package ID and registry ID for configuration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = process.env.SUI_NETWORK || 'testnet';
const RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io';

console.log('🚀 Deploying Design Package Contract...');
console.log(`Network: ${NETWORK}`);
console.log(`RPC URL: ${RPC_URL}`);

try {
  // Change to the design package directory
  const packageDir = path.join(__dirname, '..', 'design_package');
  process.chdir(packageDir);

  console.log('📦 Building Move package...');
  
  // Build the package
  const buildOutput = execSync('sui move build', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Package built successfully');

  console.log('🚀 Publishing package...');
  
  // Publish the package
  const publishOutput = execSync(`sui client publish --gas-budget 100000000`, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Package published successfully');
  
  // Extract package ID and registry ID from output
  const lines = publishOutput.split('\n');
  let packageId = '';
  let registryId = '';
  
  for (const line of lines) {
    if (line.includes('Created Objects:')) {
      const nextLine = lines[lines.indexOf(line) + 1];
      if (nextLine.includes('0x')) {
        // Extract the first object ID (registry)
        const match = nextLine.match(/0x[a-fA-F0-9]{64}/);
        if (match) {
          registryId = match[0];
        }
      }
    }
    if (line.includes('PackageID:')) {
      const match = line.match(/0x[a-fA-F0-9]{64}/);
      if (match) {
        packageId = match[0];
      }
    }
  }
  
  if (!packageId) {
    // Try alternative parsing
    const packageMatch = publishOutput.match(/PackageID:\s*(0x[a-fA-F0-9]{64})/);
    if (packageMatch) {
      packageId = packageMatch[1];
    }
  }
  
  if (!registryId) {
    // Try alternative parsing for registry
    const registryMatch = publishOutput.match(/Created Objects:\s*\n\s*(0x[a-fA-F0-9]{64})/);
    if (registryMatch) {
      registryId = registryMatch[1];
    }
  }
  
  console.log('\n📋 Deployment Results:');
  console.log(`Package ID: ${packageId}`);
  console.log(`Registry ID: ${registryId}`);
  
  if (!packageId || !registryId) {
    console.log('\n⚠️  Could not automatically extract IDs. Please check the output above.');
    console.log('Look for "PackageID:" and "Created Objects:" in the output.');
  } else {
    // Create environment file
    const envContent = `# Contract Configuration
NEXT_PUBLIC_PACKAGE_ID=${packageId}
NEXT_PUBLIC_REGISTRY_ID=${registryId}

# Seal Configuration
NEXT_PUBLIC_SEAL_ENABLED=true
NEXT_PUBLIC_SEAL_THRESHOLD=2
NEXT_PUBLIC_SEAL_KEY_SERVERS=0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75,0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8

# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=${NETWORK}
NEXT_PUBLIC_SUI_RPC_URL=${RPC_URL}
`;

    const envFile = path.join(__dirname, '..', '.env.local');
    fs.writeFileSync(envFile, envContent);
    
    console.log('\n✅ Environment file created: .env.local');
    console.log('\n🔧 Next steps:');
    console.log('1. Update your .env.local file with the correct values');
    console.log('2. Restart your development server');
    console.log('3. Test the Seal integration');
    
    // Also create a deployment info file
    const deploymentInfo = {
      packageId,
      registryId,
      network: NETWORK,
      rpcUrl: RPC_URL,
      deployedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const infoFile = path.join(__dirname, '..', 'deployment-info.json');
    fs.writeFileSync(infoFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n📄 Deployment info saved to: deployment-info.json');
  }
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  
  if (error.message.includes('sui: command not found')) {
    console.log('\n💡 Make sure you have the Sui CLI installed:');
    console.log('   cargo install --locked --git https://github.com/MystenLabs/sui.git --tag mainnet-v1.14.0 sui');
  }
  
  if (error.message.includes('No active address')) {
    console.log('\n💡 Make sure you have an active Sui address:');
    console.log('   sui client new-address ed25519');
    console.log('   sui client switch --address <your-address>');
  }
  
  if (error.message.includes('Insufficient gas')) {
    console.log('\n💡 Make sure you have enough SUI tokens:');
    console.log('   sui client faucet');
  }
  
  process.exit(1);
}

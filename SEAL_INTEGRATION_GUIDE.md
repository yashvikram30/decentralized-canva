# 🔐 Seal Integration Guide

This guide explains how to properly integrate Seal encryption with your decentralized Canva application using the Move contract and TypeScript SDK.

## 📋 Overview

The integration consists of:
- **Move Contract**: Contains `seal_approve` functions for access control
- **TypeScript SDK**: Handles encryption/decryption with proper Seal API
- **Walrus Storage**: Stores encrypted designs on Sui network
- **Access Control**: Manages permissions and user authentication

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   TypeScript    │    │   Move Contract │
│   (React)       │◄──►│   SDK Layer     │◄──►│   (Sui)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Walrus        │
                       │   Storage       │
                       └─────────────────┘
```

## 🚀 Quick Start

### 1. Deploy the Contract

```bash
# Deploy to testnet
npm run deploy-contract

# Or manually
cd design_package
sui move build
sui client publish --gas-budget 100000000
```

### 2. Configure Environment

Create `.env.local`:
```env
# Contract Configuration
NEXT_PUBLIC_PACKAGE_ID=0xYOUR_PACKAGE_ID
NEXT_PUBLIC_REGISTRY_ID=0xYOUR_REGISTRY_ID

# Seal Configuration
NEXT_PUBLIC_SEAL_ENABLED=true
NEXT_PUBLIC_SEAL_THRESHOLD=2
NEXT_PUBLIC_SEAL_KEY_SERVERS=0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75,0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8

# Sui Network
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io
```

### 3. Test the Integration

```bash
# Run integration tests
npm run test-seal

# Or in browser console
testSealIntegration()
```

## 📝 Move Contract Details

### Contract Structure

The contract (`design_package/sources/design_package.move`) includes:

- **DesignMetadata**: Stores design information on-chain
- **DesignRegistry**: Manages all designs
- **seal_approve**: Critical function for Seal access control

### Key Functions

#### `seal_approve`
```move
public fun seal_approve(
    id: vector<u8>,           // User identity (without package prefix)
    design_id: ID,            // Design to access
    registry: &DesignRegistry, // Registry reference
    ctx: &TxContext           // Transaction context
)
```

This function is called by Seal key servers to validate access. It must:
- Take the identity as the first parameter
- Abort if access is denied
- Be side-effect free

#### Alternative Access Patterns

The contract includes multiple `seal_approve` variants:

- `seal_approve_public`: Allows public access to published designs
- `seal_approve_collaborative`: Implements collaborative access control

## 🔧 TypeScript Integration

### SealSDKAdapter

The `SealSDKAdapter` class provides a clean interface to the Seal SDK:

```typescript
// Initialize
await sealSDKAdapter.initialize();

// Encrypt data
const result = await sealSDKAdapter.encryptData(
  data,
  userAddress,
  accessPolicyId
);

// Decrypt data
const decrypted = await sealSDKAdapter.decryptData(
  encryptedData,
  accessPolicyId,
  userAddress,
  designId
);
```

### Proper Seal API Usage

The integration now uses the correct Seal API:

```typescript
// Encryption
const { encryptedObject: encryptedBytes, key: backupKey } = await sealClient.encrypt({
  threshold: 2,
  packageId: fromHEX(packageId),
  id: fromHEX(userAddress),
  data,
});

// Decryption with transaction block
const tx = new Transaction();
tx.moveCall({
  target: `${packageId}::design_registry::seal_approve`,
  arguments: [
    tx.pure.vector("u8", Array.from(fromHEX(userAddress))),
    tx.object(designId),
    tx.object(registryId),
  ]
});
const txBytes = tx.build({ client: suiClient, onlyTransactionKind: true });
const decryptedBytes = await sealClient.decrypt({
  data: encryptedData,
  txBytes,
});
```

## 🔐 Security Features

### Access Control

1. **Ownership Validation**: Only design owners can access their data
2. **Policy-Based Access**: Supports complex access policies
3. **Time-Based Access**: Can implement subscription-based access
4. **Collaborative Access**: Supports team-based permissions

### Encryption

1. **Threshold Cryptography**: Uses Seal's threshold encryption
2. **Key Server Distribution**: Keys distributed across multiple servers
3. **Backup Keys**: Users can store backup keys for disaster recovery
4. **Forward Secrecy**: Compromised keys don't affect past data

## 🧪 Testing

### Integration Tests

The `SealIntegrationTester` provides comprehensive testing:

```typescript
// Run all tests
await sealIntegrationTester.runAllTests();

// Individual tests
await sealIntegrationTester.testContractDeployment();
await sealIntegrationTester.testSealEncryption();
await sealIntegrationTester.testSealDecryption();
await sealIntegrationTester.testAccessControl();
await sealIntegrationTester.testWalrusIntegration();
await sealIntegrationTester.testEndToEndFlow();
```

### Test Coverage

- ✅ Contract deployment and accessibility
- ✅ Seal encryption/decryption
- ✅ Access control validation
- ✅ Walrus storage integration
- ✅ End-to-end data flow
- ✅ Error handling and edge cases

## 🚨 Production Checklist

Before deploying to production:

- [ ] Deploy contract to mainnet
- [ ] Update environment variables with production values
- [ ] Configure real Seal key servers
- [ ] Test with real Sui network
- [ ] Implement proper error handling
- [ ] Add monitoring and logging
- [ ] Set up backup key management
- [ ] Review access control policies

## 🔧 Troubleshooting

### Common Issues

1. **Contract Not Found**
   - Ensure package ID is correct
   - Check if contract is deployed
   - Verify network configuration

2. **Seal SDK Errors**
   - Check key server configuration
   - Verify threshold settings
   - Ensure proper transaction block format

3. **Access Denied**
   - Verify user address format
   - Check seal_approve function logic
   - Ensure proper transaction context

### Debug Commands

```bash
# Check contract status
sui client object <PACKAGE_ID>
sui client object <REGISTRY_ID>

# Test Seal integration
npm run test-seal

# Check environment
node -e "console.log(process.env.NEXT_PUBLIC_PACKAGE_ID)"
```

## 📚 Additional Resources

- [Seal Documentation](https://seal-docs.wal.app/UsingSeal/)
- [Sui Move Documentation](https://docs.sui.io/build/move)
- [Walrus Documentation](https://docs.wal.app/)
- [Seal SDK Examples](https://github.com/MystenLabs/seal)

## 🤝 Contributing

When contributing to the Seal integration:

1. Follow the existing code patterns
2. Add comprehensive tests
3. Update documentation
4. Test with both testnet and mainnet
5. Ensure backward compatibility

## 📄 License

This integration follows the same license as the main project.

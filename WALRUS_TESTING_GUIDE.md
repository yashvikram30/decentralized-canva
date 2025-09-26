# Walrus Storage Testing Guide

This guide explains how to test if files are being properly stored on the Walrus decentralized storage network.

## 🧪 Testing Methods

### 1. **Console Logging Verification**

The Walrus client includes comprehensive logging. Check your browser's developer console for these messages:

#### Successful Storage:
```
📦 Storing to Walrus...
✅ Successfully stored to Walrus: [blobId]
```

#### Successful Retrieval:
```
📥 Retrieving from Walrus: [blobId]
✅ Successfully retrieved from Walrus
```

#### Error Cases:
```
❌ Walrus storage failed: [error details]
❌ Walrus retrieval failed: [error details]
```

### 2. **UI Feedback Testing**

The SaveDialog component provides visual feedback:

- **Loading States**: Spinner shows during storage/retrieval
- **Success Messages**: Green success box with blob ID
- **Error Messages**: Red error box with specific error details
- **Wallet Status**: Blue info box when wallet is generated

### 3. **Network Tab Verification**

1. Open Browser DevTools → Network tab
2. Save a design
3. Look for requests to:
   - Sui RPC endpoints (for wallet operations)
   - Walrus storage nodes (for actual data storage)

### 4. **Blob ID Verification**

After saving, you'll receive a unique blob ID. Test retrieval by:
1. Copy the blob ID from the success message
2. Switch to "Load Design" tab
3. Paste the blob ID
4. Click "Load from Walrus"

## 🔧 Testing Scenarios

### Basic Storage Test
```typescript
// 1. Create a simple design on canvas
// 2. Click Save button
// 3. Enter design name
// 4. Click "Save to Walrus"
// 5. Verify success message and blob ID
```

### Storage and Retrieval Test
```typescript
// 1. Save a design (note the blob ID)
// 2. Clear the canvas
// 3. Switch to Load tab
// 4. Paste the blob ID
// 5. Click "Load from Walrus"
// 6. Verify design loads correctly
```

### Error Handling Test
```typescript
// 1. Try to save without a design name
// 2. Try to load with invalid blob ID
// 3. Test network disconnection scenarios
```

## 🐛 Common Issues & Solutions

### Issue: "Failed to create signer"
**Solution**: Check if Sui network is accessible and environment variables are set correctly.

### Issue: "Faucet request failed"
**Solution**: This is normal on testnet - the app will continue anyway if you have SUI.

### Issue: "Retryable error - please try again"
**Solution**: Network issue - retry the operation.

### Issue: "Walrus storage failed"
**Solution**: Check network connection and Sui RPC URL configuration.

## 🔍 Debugging Tools

### 1. Environment Check
Verify your `.env.local` file has:
```bash
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io
```

### 2. Console Debugging
Add this to your browser console to check Walrus client status:
```javascript
// Check if Walrus client is initialized
console.log('Walrus client:', window.walrusClient);

// Check current signer
console.log('Signer address:', suiSignerService.getAddress());
```

### 3. Network Status
Check if you can reach Sui testnet:
```bash
curl https://fullnode.testnet.sui.io
```

## 📊 Success Indicators

### ✅ Storage Working Correctly:
- Console shows "Successfully stored to Walrus"
- UI shows green success message with blob ID
- Blob ID is a valid string (not empty)
- Can retrieve the same design using the blob ID

### ❌ Storage Not Working:
- Console shows error messages
- UI shows red error message
- No blob ID generated
- Cannot retrieve saved designs

## 🚀 Advanced Testing

### Test with Different Data Sizes
1. Save a simple design (small data)
2. Save a complex design with many elements (large data)
3. Verify both work correctly

### Test Persistence
1. Save a design
2. Close the browser
3. Reopen and load the design using the blob ID
4. Verify it loads correctly

### Test Error Recovery
1. Disconnect from internet
2. Try to save (should show error)
3. Reconnect to internet
4. Try to save again (should work)

## 📝 Test Checklist

- [ ] Environment variables configured
- [ ] Console shows successful storage messages
- [ ] UI shows success feedback
- [ ] Blob ID is generated and valid
- [ ] Can retrieve saved design
- [ ] Error handling works for invalid inputs
- [ ] Network errors are handled gracefully
- [ ] Wallet generation works automatically
- [ ] Faucet requests work (or fail gracefully)

## 🔧 Manual Testing Commands

### Check Sui Network Connection
```bash
curl -X POST https://fullnode.testnet.sui.io \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"sui_getChainIdentifier","params":[],"id":1}'
```

### Check Walrus WASM Loading
Open browser console and check:
```javascript
// Should not throw an error
new WalrusClient({...})
```

## 📞 Getting Help

If you encounter issues:

1. Check the console for error messages
2. Verify environment configuration
3. Test network connectivity
4. Check if Sui testnet is operational
5. Review the WALRUS_SETUP.md for configuration details

Remember: Walrus is a decentralized storage network, so some operations may take longer than traditional cloud storage, especially during network congestion.

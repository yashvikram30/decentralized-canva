# Walrus Integration Setup Guide

This guide explains how to set up and use the Walrus decentralized storage integration in your Decentralized Canva project.

## ✅ What's Been Implemented

### 1. **Real Walrus SDK Integration**
- ✅ Replaced mock implementation with actual `@mysten/walrus` SDK
- ✅ Proper SuiClient configuration for testnet/mainnet
- ✅ WASM support for browser usage
- ✅ Error handling with `RetryableWalrusClientError`

### 2. **Security Improvements**
- ✅ Moved AI services to server-side API routes
- ✅ Removed `dangerouslyAllowBrowser` security risk
- ✅ API keys now stored server-side only

### 3. **Proper Configuration**
- ✅ Updated environment configuration
- ✅ Next.js configuration for Walrus WASM support
- ✅ Sui signer service for wallet management

## 🚀 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root:

```bash
# AI Services (Server-side only)
OPENAI_API_KEY=your_openai_api_key_here

# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io

# Optional: Custom WASM URL
NEXT_PUBLIC_WALRUS_WASM_URL=https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm
```

### 2. Install Dependencies

The required dependencies are already installed:

```bash
npm install @mysten/walrus @mysten/sui openai
```

### 3. Run the Application

```bash
npm run dev
```

## 🔧 How It Works

### Walrus Storage Flow

1. **Wallet Generation**: When saving, a new Sui keypair is generated automatically
2. **Faucet Request**: SUI tokens are requested from testnet faucet for transactions
3. **Data Storage**: Design data is encoded and stored on Walrus network
4. **Blob ID**: A unique blob ID is returned for retrieval

### AI Services Flow

1. **Client Request**: Frontend sends request to `/api/ai/*` endpoints
2. **Server Processing**: API routes handle OpenAI calls server-side
3. **Secure Response**: Results returned without exposing API keys

## 📁 File Structure

```
src/
├── services/
│   ├── walrusClient.ts      # Real Walrus SDK implementation
│   ├── aiServices.ts        # Client-side AI service (calls API routes)
│   └── suiSigner.ts         # Sui wallet management
├── hooks/
│   └── useWalrus.ts        # React hook for Walrus operations
├── app/api/ai/             # Server-side AI API routes
│   ├── text/route.ts
│   ├── image/route.ts
│   ├── analyze/route.ts
│   └── suggestions/route.ts
└── components/Storage/
    └── SaveDialog.tsx      # Updated to use real Walrus
```

## 🎯 Usage Examples

### Saving to Walrus

```typescript
import { useWalrus } from '@/hooks/useWalrus';
import { suiSignerService } from '@/services/suiSigner';

const { store, isStoring, error } = useWalrus();

const handleSave = async () => {
  // Generate signer if needed
  if (!suiSignerService.hasSigner()) {
    suiSignerService.generateKeypair();
    await suiSignerService.requestFaucet(); // For testnet
  }

  const signer = suiSignerService.getSigner();
  const result = await store(designData, signer, 3); // 3 epochs
  console.log('Blob ID:', result.blobId);
};
```

### Loading from Walrus

```typescript
const { retrieve, isRetrieving } = useWalrus();

const handleLoad = async (blobId: string) => {
  const result = await retrieve(blobId);
  console.log('Design data:', result.data);
};
```

### Using AI Services

```typescript
import { useAI } from '@/hooks/useAI';

const { generateText, generateImage, analyzeDesign } = useAI();

// These now call server-side API routes securely
const text = await generateText("Create a modern logo design");
const image = await generateImage("A beautiful sunset landscape");
const analysis = await analyzeDesign(canvasData);
```

## ⚠️ Important Notes

### Security
- **Never expose API keys**: All AI calls go through server-side API routes
- **Testnet only**: Current setup uses Sui testnet for development
- **Public data**: All Walrus blobs are public and discoverable

### Performance
- **Network requests**: Walrus operations require ~2200 requests to write, ~335 to read
- **Consider aggregators**: For production, use Walrus aggregators for better UX
- **WASM loading**: Initial WASM load may take a moment

### Costs
- **SUI tokens**: Required for Walrus transactions
- **Storage epochs**: Blobs are stored for specified number of epochs
- **Gas fees**: Sui network gas fees apply

## 🐛 Troubleshooting

### Common Issues

1. **"No signer available"**
   - Solution: Ensure `suiSignerService.generateKeypair()` is called

2. **"Insufficient SUI balance"**
   - Solution: Call `suiSignerService.requestFaucet()` for testnet

3. **"WASM loading failed"**
   - Solution: Check network connection and WASM URL configuration

4. **"AI service failed"**
   - Solution: Verify `OPENAI_API_KEY` is set in environment variables

### Debug Mode

Enable debug logging by setting:

```bash
NEXT_PUBLIC_DEBUG=true
```

## 🔄 Migration from Mock

If you were using the previous mock implementation:

1. **Update imports**: Change from mock `walrusClient` to real implementation
2. **Add signer**: All store/delete operations now require a signer parameter
3. **Handle errors**: Implement proper error handling for network issues
4. **Update UI**: Loading states now use real `isStoring`/`isRetrieving` flags

## 📚 Additional Resources

- [Walrus Documentation](https://docs.wal.app/)
- [Sui SDK Documentation](https://docs.sui.io/build/sdk)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🎉 You're Ready!

Your Decentralized Canva now has:
- ✅ Real Walrus decentralized storage
- ✅ Secure AI integration
- ✅ Proper error handling
- ✅ Production-ready architecture

Start creating and storing designs on the decentralized web! 🚀

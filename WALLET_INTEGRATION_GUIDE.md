# Wallet Integration Guide

## Overview

This guide explains the comprehensive wallet integration implemented in the decentralized Canva project. The system now supports multiple wallet providers with proper security and user consent.

## Supported Wallets

### 1. **Sui Wallet** (Primary)
- **Type**: Browser extension
- **Installation**: [Chrome Web Store](https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil)
- **Features**: Official Sui wallet, full ecosystem support
- **Security**: High - user controls private keys

### 2. **Suiet** (Alternative)
- **Type**: Browser extension + mobile app
- **Installation**: [Chrome Web Store](https://chrome.google.com/webstore/detail/suiet-sui-wallet/khpkpbbccdmmkpmpfhpibbleinikpne)
- **Features**: Popular alternative with great UX
- **Security**: High - user controls private keys

### 3. **Unsafe Burner** (Development)
- **Type**: In-browser keypair generation
- **Installation**: Always available
- **Features**: Quick testing and development
- **Security**: Low - for development only

## Architecture

### Wallet Context (`src/contexts/WalletContext.tsx`)

The wallet context provides centralized wallet management:

```typescript
interface WalletContextType {
  // State
  isConnected: boolean;
  address: string | null;
  balance: string;
  walletName: string | null;
  walletType: 'sui-wallet' | 'suiet' | 'unsafe-burner' | null;
  
  // Actions
  connect: (walletType: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signTransaction: (transactionBlock: any) => Promise<any>;
  getAvailableWallets: () => Array<{name: string; type: string; installed: boolean}>;
}
```

### Key Features

1. **Multi-Wallet Support**: Automatically detects installed wallets
2. **Wallet Switching**: Users can connect different wallets
3. **Transaction Signing**: Proper user consent for all transactions
4. **Balance Management**: Real-time SUI balance updates
5. **Error Handling**: Comprehensive error management
6. **Security**: No private key storage in the application

## Usage

### Connecting a Wallet

```typescript
import { useWallet } from '@/contexts/WalletContext';

function MyComponent() {
  const { connect, isConnected, address, walletName } = useWallet();
  
  const handleConnect = async () => {
    try {
      await connect('sui-wallet'); // or 'suiet' or 'unsafe-burner'
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };
  
  return (
    <div>
      {isConnected ? (
        <p>Connected: {address} ({walletName})</p>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Signing Transactions

```typescript
const { signTransaction, isConnected } = useWallet();

const handleSignTransaction = async (transactionBlock: any) => {
  if (!isConnected) {
    throw new Error('Wallet not connected');
  }
  
  try {
    const result = await signTransaction(transactionBlock);
    return result;
  } catch (error) {
    console.error('Transaction signing failed:', error);
    throw error;
  }
};
```

## Security Features

### 1. **No Private Key Storage**
- Private keys are never stored in the application
- All signing is done through wallet extensions
- Users maintain full control of their keys

### 2. **User Consent**
- Every transaction requires explicit user approval
- Clear indication of what the app can do
- Easy wallet disconnection

### 3. **Wallet Verification**
- Wallet addresses are verified before transactions
- Clear indication of connected wallet type
- Protection against wallet switching attacks

## UI Components

### Wallet Modal (`src/components/Wallet/WalletModal.tsx`)

The wallet modal provides a clean interface for wallet selection:

- **Wallet Detection**: Automatically shows available wallets
- **Installation Links**: Direct links to install missing wallets
- **Visual Indicators**: Clear status for each wallet option
- **Error Handling**: User-friendly error messages

### Wallet Status (`src/components/Wallet/WalletStatus.tsx`)

The wallet status component shows current connection state:

- **Connection Status**: Visual indicator of wallet connection
- **Address Display**: Truncated wallet address with copy functionality
- **Balance Display**: Real-time SUI balance with refresh
- **Wallet Type**: Clear indication of connected wallet type

## Integration with Walrus Storage

The wallet integration is seamlessly connected to Walrus storage:

### Save Dialog Updates

- **Wallet Requirement**: Users must connect wallet before saving
- **Metadata Storage**: Wallet information is stored with designs
- **Transaction Signing**: All Walrus operations require wallet signature

### Design Metadata

```typescript
{
  designData: {...},
  metadata: {
    name: "My Design",
    created: "2024-01-01T00:00:00.000Z",
    encrypted: false,
    walletAddress: "0x...",
    walletName: "Sui Wallet",
    walletType: "sui-wallet"
  }
}
```

## Testing

### Manual Testing

1. **Install Wallet Extensions**:
   - Install Sui Wallet extension
   - Install Suiet extension (optional)

2. **Test Connection Flow**:
   - Click "Connect Wallet" button
   - Select wallet type
   - Approve connection in wallet
   - Verify status display

3. **Test Save Functionality**:
   - Create a design
   - Click "Save" button
   - Verify wallet connection requirement
   - Complete save process

4. **Test Wallet Switching**:
   - Connect one wallet
   - Disconnect and connect different wallet
   - Verify address and balance updates

### Automated Testing

The project includes comprehensive testing utilities:

- **Wallet Test Panel**: Test wallet connection and functionality
- **Walrus Test Panel**: Test storage operations
- **Error Handling**: Test various error scenarios

## Development vs Production

### Development Mode
- **Unsafe Burner**: Available for quick testing
- **Faucet Integration**: Automatic SUI requests for testing
- **Debug Logging**: Detailed console output

### Production Mode
- **Real Wallets Only**: Sui Wallet and Suiet
- **User Consent**: All transactions require approval
- **Security**: No private key access

## Troubleshooting

### Common Issues

1. **Wallet Not Detected**:
   - Ensure wallet extension is installed
   - Refresh the page
   - Check browser compatibility

2. **Connection Failed**:
   - Check wallet permissions
   - Ensure wallet is unlocked
   - Try disconnecting and reconnecting

3. **Transaction Failed**:
   - Check SUI balance
   - Verify network connection
   - Check transaction parameters

### Debug Information

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'wallet:*');
```

## Future Enhancements

### Planned Features

1. **Multi-Wallet Support**: Connect multiple wallets simultaneously
2. **Wallet Analytics**: Track usage and performance
3. **Advanced Transactions**: Batch operations and gas optimization
4. **Mobile Support**: Mobile wallet integration
5. **Hardware Wallets**: Ledger and other hardware wallet support

### Integration Opportunities

1. **DeFi Integration**: Connect with Sui DeFi protocols
2. **NFT Support**: Mint and manage NFTs
3. **Social Features**: Share designs with wallet verification
4. **Marketplace**: Buy/sell designs with wallet payments

## Security Best Practices

### For Users

1. **Verify Transactions**: Always review transaction details
2. **Keep Wallets Updated**: Use latest wallet versions
3. **Secure Storage**: Use hardware wallets for large amounts
4. **Regular Backups**: Backup wallet seed phrases

### For Developers

1. **No Private Key Access**: Never request private keys
2. **Clear Permissions**: Request only necessary permissions
3. **Error Handling**: Provide clear error messages
4. **Testing**: Test with multiple wallet types

## Conclusion

The wallet integration provides a secure, user-friendly way to interact with the Sui blockchain. Users maintain full control of their private keys while enjoying seamless integration with the decentralized Canva application.

For questions or issues, please refer to the troubleshooting section or create an issue in the project repository.

# MongoDB Integration Guide

This guide explains the MongoDB integration system for storing canvas designs with dual storage strategy.

## Overview

The system implements a dual storage approach:
- **Encrypted Storage**: Walrus + Seal encryption for secure, privacy-focused operations
- **Quick Access Storage**: MongoDB for fast loading of user designs in "My Designs" feature

## Architecture

```
Canvas Design Save Flow:
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Canvas    │───▶│ Encrypted    │───▶│   Walrus    │
│   Data      │    │ Storage      │    │ (Encrypted) │
└─────────────┘    └──────────────┘    └─────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   MongoDB    │
                   │ (Unencrypted)│
                   └──────────────┘

Canvas Design Load Flow:
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ My Designs  │───▶│   MongoDB    │───▶│   Canvas    │
│   UI        │    │ (Fast Load)  │    │   Load      │
└─────────────┘    └──────────────┘    └─────────────┘
```

## Database Schema

### UserDesignDocument

```typescript
interface UserDesignDocument {
  _id?: string;                    // MongoDB ObjectId
  walletAddress: string;           // User's wallet address
  designId: string;                // Unique design identifier
  name: string;                    // Design name
  canvasData: object;              // Raw JSON canvas state
  blobId?: string;                 // Optional Walrus blob ID
  createdAt: Date;                 // Creation timestamp
  updatedAt: Date;                 // Last update timestamp
  metadata: {
    canvasSize: { width: number; height: number };
    elementCount: number;
    lastModified: Date;
  };
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install mongodb
```

### 2. Environment Configuration

Add to your `.env.local`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=decentralized_canva
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DB_NAME=decentralized_canva
```

### 3. Database Setup

Run the setup script to create indexes:

```bash
npm run setup-mongodb
```

This will:
- Connect to MongoDB
- Create the `decentralized_canva` database
- Create the `user_designs` collection
- Set up performance indexes

### 4. Local MongoDB (Optional)

For local development, install MongoDB:

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

## API Reference

### MongoDBService

```typescript
class MongoDBService {
  // Save a new design
  async saveUserDesign(walletAddress: string, designData: DesignData): Promise<UserDesignDocument>
  
  // Get all designs for a user
  async getUserDesigns(walletAddress: string): Promise<UserDesignDocument[]>
  
  // Load design data for canvas
  async loadDesignToCanvas(designId: string): Promise<object>
  
  // Delete a design
  async deleteUserDesign(designId: string): Promise<boolean>
  
  // Update an existing design
  async updateUserDesign(designId: string, updates: Partial<DesignData>): Promise<boolean>
}
```

### EncryptedStorageService (Updated)

```typescript
class EncryptedStorageService {
  // Save design (now saves to both Walrus and MongoDB)
  async saveDesign(name: string, canvasData: any, owner: string, signer: any, permissions?: Partial<AccessPolicy['permissions']>): Promise<StoredDesign>
  
  // Get MongoDB designs for quick access
  async getMongoDBDesigns(walletAddress: string): Promise<UserDesignDocument[]>
  
  // Load design directly from MongoDB
  async loadDesignFromMongoDB(designId: string): Promise<object>
}
```

## Components

### DesignsList

A React component that displays user designs in a grid or list view.

**Props:**
- `walletAddress: string | null` - User's wallet address
- `onLoadDesign: (designId: string) => Promise<void>` - Load design callback
- `onDeleteDesign?: (designId: string) => Promise<void>` - Delete design callback
- `refreshTrigger?: number` - Trigger refresh from parent

### DesignCard

Individual design item component with thumbnail and actions.

**Props:**
- `design: UserDesignDocument` - Design data
- `onLoadDesign: (designId: string) => Promise<void>` - Load callback
- `onDeleteDesign?: (designId: string) => Promise<void>` - Delete callback
- `isLoading?: boolean` - Loading state

## Usage Examples

### Loading a Design to Canvas

```typescript
import { useMongoDBDesigns } from '../hooks/useMongoDBDesigns';

const { loadDesignToCanvas } = useMongoDBDesigns();

const handleLoadDesign = async (designId: string) => {
  try {
    await loadDesignToCanvas(designId, canvas);
    console.log('Design loaded successfully');
  } catch (error) {
    console.error('Failed to load design:', error);
  }
};
```

### Saving a Design

```typescript
import { encryptedStorage } from '../services/encryptedStorage';

const handleSaveDesign = async () => {
  try {
    const canvasData = canvas.toJSON();
    await encryptedStorage.saveDesign(
      'My Design',
      canvasData,
      walletAddress,
      signer
    );
    console.log('Design saved to both Walrus and MongoDB');
  } catch (error) {
    console.error('Failed to save design:', error);
  }
};
```

## Database Indexes

The system creates the following indexes for optimal performance:

1. **walletAddress** - Fast user queries
2. **designId** (unique) - Fast design lookups
3. **createdAt** - Sorting by creation date
4. **walletAddress + createdAt** - User designs sorted by date
5. **updatedAt** - Recent designs queries

## Error Handling

The system includes comprehensive error handling:

- **Connection failures**: Graceful fallback to encrypted storage only
- **MongoDB errors**: Logged and handled without breaking the UI
- **Canvas loading errors**: User-friendly error messages
- **Network issues**: Retry mechanisms and offline support

## Security Considerations

1. **Data Storage**: MongoDB stores unencrypted JSON for fast access
2. **Access Control**: Designs are tied to wallet addresses
3. **Fallback**: Encrypted storage remains the primary security layer
4. **Cleanup**: Deleted designs are removed from both storage systems

## Performance Benefits

1. **Fast Loading**: Direct JSON loading without decryption
2. **Efficient Queries**: Optimized indexes for user design lists
3. **Reduced Latency**: No encryption/decryption overhead for "My Designs"
4. **Scalable**: MongoDB handles large numbers of designs efficiently

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MongoDB URI in environment variables
   - Ensure MongoDB is running
   - Verify network connectivity

2. **Designs Not Loading**
   - Check wallet connection
   - Verify MongoDB indexes are created
   - Check browser console for errors

3. **Slow Performance**
   - Run `npm run setup-mongodb` to create indexes
   - Check MongoDB connection string
   - Monitor database performance

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

This will show detailed MongoDB operation logs in the browser console.

## Future Enhancements

1. **Design Thumbnails**: Generate and store canvas previews
2. **Design Sharing**: Public/private design visibility
3. **Design Categories**: Tag and organize designs
4. **Bulk Operations**: Import/export multiple designs
5. **Analytics**: Track design usage and popularity

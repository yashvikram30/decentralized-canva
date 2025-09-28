# MongoDB Atlas Setup Guide

## Quick Setup (5 minutes)

### 1. Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Sign up with Google/GitHub or email

### 2. Create a Free Cluster
1. Choose "Shared" (Free tier)
2. Select a region close to you
3. Name your cluster (e.g., "decentralized-canva")
4. Click "Create Cluster"

### 3. Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

### 4. Configure Environment
Create `.env.local` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=decentralized_canva
```

### 5. Test Connection
```bash
npm run setup-mongodb
```

## What You Get

✅ **Free Forever**: 512MB storage, shared clusters  
✅ **No Installation**: Cloud-hosted database  
✅ **Automatic Backups**: Built-in data protection  
✅ **Global Access**: Access from anywhere  
✅ **Security**: Built-in authentication and encryption  

## Database Structure

The system will automatically create:
- **Database**: `decentralized_canva`
- **Collection**: `user_designs`
- **Indexes**: Optimized for fast queries

## Troubleshooting

**Connection Issues:**
- Check your IP is whitelisted in Atlas
- Verify username/password in connection string
- Ensure cluster is running (not paused)

**Free Tier Limits:**
- 512MB storage
- Shared CPU/RAM
- 100 connections max

## Production Considerations

For production, consider:
- Upgrade to paid tier for more resources
- Set up proper backup schedules
- Configure monitoring and alerts
- Use connection pooling for better performance

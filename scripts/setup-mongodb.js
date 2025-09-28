#!/usr/bin/env node

/**
 * MongoDB Setup Script for Decentralized Canva
 * 
 * This script helps set up MongoDB for the decentralized canva application.
 * It creates the necessary database and collections with proper indexes.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'decentralized_canva';

// Check if using MongoDB Atlas
const isAtlas = MONGODB_URI.includes('mongodb+srv://');

async function setupMongoDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Setting up database: ${DB_NAME}`);
    
    // Import the UserDesign model to create indexes
    const UserDesignSchema = new mongoose.Schema({
      walletAddress: { type: String, required: true, index: true },
      designId: { type: String, required: true, unique: true, index: true },
      name: { type: String, required: true, trim: true },
      canvasData: { type: mongoose.Schema.Types.Mixed, required: true },
      blobId: { type: String, required: false },
      metadata: {
        canvasSize: {
          width: { type: Number, required: true },
          height: { type: Number, required: true }
        },
        elementCount: { type: Number, required: true, default: 0 },
        lastModified: { type: Date, required: true, default: Date.now }
      }
    }, {
      timestamps: true,
      collection: 'user_designs'
    });

    // Create compound indexes
    UserDesignSchema.index({ walletAddress: 1, createdAt: -1 });
    UserDesignSchema.index({ updatedAt: -1 });

    const UserDesign = mongoose.model('UserDesign', UserDesignSchema);
    
    console.log('🔍 Creating indexes...');
    
    // Ensure indexes are created
    await UserDesign.ensureIndexes();
    console.log('  ✓ All indexes created successfully');
    
    console.log('\n🎉 MongoDB setup completed successfully!');
    console.log(`📁 Database: ${DB_NAME}`);
    console.log('📋 Collection: user_designs');
    console.log('🔍 Indexes: Created via Mongoose schema');
    
    // Test the connection with a simple query
    const count = await UserDesign.countDocuments();
    console.log(`\n📊 Database stats:`);
    console.log(`  - Documents in user_designs: ${count}`);
    console.log(`  - Database: ${DB_NAME}`);
    console.log(`  - Connection: ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    
  } catch (error) {
    console.error('❌ MongoDB setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the setup
if (require.main === module) {
  setupMongoDB().catch(console.error);
}

module.exports = { setupMongoDB };

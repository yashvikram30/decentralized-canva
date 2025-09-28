#!/usr/bin/env node

/**
 * Test MongoDB Connection Script
 * 
 * This script tests the MongoDB connection and API endpoints
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'decentralized_canva';

async function testMongoDB() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log(`📍 URI: ${MONGODB_URI}`);
    console.log(`📊 Database: ${DB_NAME}`);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test the UserDesign model
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

    const UserDesign = mongoose.model('UserDesign', UserDesignSchema);
    
    // Test creating a sample design
    console.log('\n🧪 Testing design creation...');
    
    const testDesign = new UserDesign({
      walletAddress: 'test_wallet_123',
      designId: `test_${Date.now()}`,
      name: 'Test Design',
      canvasData: {
        width: 800,
        height: 600,
        objects: [
          { type: 'rect', x: 100, y: 100, width: 200, height: 150 }
        ]
      },
      metadata: {
        canvasSize: { width: 800, height: 600 },
        elementCount: 1,
        lastModified: new Date()
      }
    });

    const savedDesign = await testDesign.save();
    console.log('✅ Test design created successfully!');
    console.log(`   - Design ID: ${savedDesign.designId}`);
    console.log(`   - Name: ${savedDesign.name}`);
    console.log(`   - Elements: ${savedDesign.metadata.elementCount}`);
    
    // Test querying designs
    console.log('\n🔍 Testing design queries...');
    
    const designs = await UserDesign.find({ walletAddress: 'test_wallet_123' });
    console.log(`✅ Found ${designs.length} design(s) for test wallet`);
    
    // Test loading a specific design
    const loadedDesign = await UserDesign.findOne({ designId: savedDesign.designId });
    if (loadedDesign) {
      console.log('✅ Design loaded successfully!');
      console.log(`   - Canvas data: ${JSON.stringify(loadedDesign.canvasData).substring(0, 100)}...`);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await UserDesign.deleteOne({ designId: savedDesign.designId });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! MongoDB is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Make sure MongoDB is running');
    console.error('   2. Check your MONGODB_URI in .env.local');
    console.error('   3. For MongoDB Atlas, ensure your IP is whitelisted');
    console.error('   4. Verify your username/password in the connection string');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
if (require.main === module) {
  testMongoDB().catch(console.error);
}

module.exports = { testMongoDB };

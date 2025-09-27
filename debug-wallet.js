// Debug script for wallet detection
// Run this in your browser console to debug wallet detection

function debugWalletDetection() {
  console.log('🔍 Sui Wallet Detection Debug Script');
  console.log('=====================================');
  
  if (typeof window === 'undefined') {
    console.log('❌ This script must be run in a browser environment');
    return;
  }
  
  console.log('\n📋 Checking for wallet-related window objects...');
  
  const walletObjects = [];
  const allKeys = Object.keys(window);
  
  // Look for objects that might be wallet-related
  const walletKeywords = ['sui', 'wallet', 'suiwallet', 'suiet'];
  
  allKeys.forEach(key => {
    const lowerKey = key.toLowerCase();
    if (walletKeywords.some(keyword => lowerKey.includes(keyword))) {
      walletObjects.push({
        key: key,
        value: window[key],
        type: typeof window[key]
      });
    }
  });
  
  console.log('Found wallet-related objects:', walletObjects);
  
  // Check specific known patterns
  const knownPatterns = [
    'suiWallet',
    'sui',
    '__sui',
    'SuiWallet',
    'suiet',
    '__suiet',
    'Suiet'
  ];
  
  console.log('\n🔍 Checking known patterns...');
  knownPatterns.forEach(pattern => {
    const exists = window[pattern] !== undefined;
    console.log(`${pattern}: ${exists ? '✅ Found' : '❌ Not found'}`);
    if (exists) {
      console.log(`  Type: ${typeof window[pattern]}`);
      console.log(`  Keys: ${Object.keys(window[pattern] || {}).join(', ')}`);
    }
  });
  
  // Check for common wallet methods
  console.log('\n🔍 Checking for wallet methods...');
  walletObjects.forEach(obj => {
    if (obj.value && typeof obj.value === 'object') {
      const methods = Object.keys(obj.value).filter(key => 
        typeof obj.value[key] === 'function'
      );
      console.log(`${obj.key} methods:`, methods);
    }
  });
  
  return walletObjects;
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.debugWalletDetection = debugWalletDetection;
  console.log('✅ Debug function available as window.debugWalletDetection()');
  console.log('Run debugWalletDetection() in the browser console to debug wallet detection');
}

// Instructions
console.log('\n📖 Instructions:');
console.log('1. Open your browser with Sui Wallet installed');
console.log('2. Open the browser console (F12)');
console.log('3. Run: debugWalletDetection()');
console.log('4. Check the output to see what wallet objects are available');
console.log('5. Share the results to help fix the detection logic');

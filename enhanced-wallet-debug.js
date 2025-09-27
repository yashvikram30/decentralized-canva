// Enhanced wallet detection debug script
// Run this in your browser console to debug wallet detection including "slush" variations

function enhancedWalletDebug() {
  console.log('🔍 Enhanced Wallet Detection Debug (Including Slush)');
  console.log('==================================================');
  
  if (typeof window === 'undefined') {
    console.log('❌ This script must be run in a browser environment');
    return;
  }
  
  // Check all window properties that might be wallet-related
  const allKeys = Object.keys(window);
  const walletKeywords = ['sui', 'wallet', 'suiwallet', 'suiet', 'mysten', 'dapp', 'slush'];
  
  console.log('\n📋 All wallet-related window objects:');
  const walletObjects = allKeys.filter(key => 
    walletKeywords.some(keyword => key.toLowerCase().includes(keyword))
  );
  
  walletObjects.forEach(key => {
    console.log(`- ${key}: ${typeof window[key]}`);
    if (typeof window[key] === 'object' && window[key] !== null) {
      console.log(`  Methods: ${Object.keys(window[key]).join(', ')}`);
    }
  });
  
  // Check for common wallet patterns including slush variations
  console.log('\n🔍 Checking specific patterns (including slush):');
  const patterns = [
    // Original Sui Wallet patterns
    'suiWallet', 'sui', '__sui', 'SuiWallet',
    // Suiet patterns
    'suiet', '__suiet', 'Suiet',
    // Slush variations
    'slush', 'slushWallet', 'slush_wallet', 'SlushWallet',
    'suiSlush', 'sui_slush', 'SuiSlush',
    // General wallet patterns
    'wallet', '__wallet', 'Wallet',
    // Mysten patterns
    'mysten', '__mysten', 'Mysten'
  ];
  
  patterns.forEach(pattern => {
    const exists = window[pattern] !== undefined;
    console.log(`${pattern}: ${exists ? '✅ Found' : '❌ Not found'}`);
    if (exists) {
      console.log(`  Type: ${typeof window[pattern]}`);
      if (typeof window[pattern] === 'object' && window[pattern] !== null) {
        console.log(`  Methods: ${Object.keys(window[pattern]).join(', ')}`);
      }
    }
  });
  
  // Check for any object with 'slush' in the name
  console.log('\n🔍 All objects with "slush" in the name:');
  const slushObjects = allKeys.filter(key => key.toLowerCase().includes('slush'));
  console.log(slushObjects);
  
  // Check for any object with 'sui' in the name
  console.log('\n🔍 All objects with "sui" in the name:');
  const suiObjects = allKeys.filter(key => key.toLowerCase().includes('sui'));
  console.log(suiObjects);
  
  // Check for any object with 'wallet' in the name
  console.log('\n🔍 All objects with "wallet" in the name:');
  const walletObjects2 = allKeys.filter(key => key.toLowerCase().includes('wallet'));
  console.log(walletObjects2);
  
  return { walletObjects, slushObjects, suiObjects, walletObjects2 };
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.enhancedWalletDebug = enhancedWalletDebug;
  console.log('✅ Enhanced debug function available as window.enhancedWalletDebug()');
  console.log('Run enhancedWalletDebug() in the browser console to debug wallet detection');
}

// Instructions
console.log('\n📖 Instructions:');
console.log('1. Open your browser with Sui Wallet (or Slush Wallet) installed');
console.log('2. Open the browser console (F12)');
console.log('3. Run: enhancedWalletDebug()');
console.log('4. Check the output to see what wallet objects are available');
console.log('5. Look specifically for "slush" related objects');
console.log('6. Share the results to help fix the detection logic');

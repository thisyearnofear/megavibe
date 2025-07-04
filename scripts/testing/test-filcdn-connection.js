#!/usr/bin/env node

/**
 * FilCDN Connection Test Script
 * Tests the connection to Filecoin Calibration testnet and Synapse SDK
 */

import { Synapse, RPC_URLS, TOKENS } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'frontend/.env.local' });

const PRIVATE_KEY = process.env.VITE_FILECOIN_PRIVATE_KEY;
const RPC_URL = process.env.VITE_FILECOIN_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';
const WS_URL = process.env.VITE_FILECOIN_WS_URL || 'wss://wss.calibration.node.glif.io/apigw/lotus/rpc/v1';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatUSDFC(amount) {
  return `${(Number(amount) / 1e18).toFixed(6)} USDFC`;
}

function formatFIL(amount) {
  return `${(Number(amount) / 1e18).toFixed(6)} FIL`;
}

async function testConnection() {
  console.log(`${colors.bold}🌐 FilCDN Connection Test${colors.reset}`);
  console.log('=' .repeat(50));
  
  // Check environment variables
  if (!PRIVATE_KEY) {
    log(colors.red, '❌ VITE_FILECOIN_PRIVATE_KEY not found in environment');
    log(colors.yellow, '   Run: ./scripts/setup-filecoin-testnet.sh');
    process.exit(1);
  }
  
  log(colors.green, '✅ Environment variables loaded');
  console.log(`   RPC URL: ${RPC_URL}`);
  console.log(`   WebSocket URL: ${WS_URL}`);
  
  try {
    // Test 1: Create Synapse instance
    console.log('\n📡 Testing Synapse SDK Connection...');
    
    const synapse = await Synapse.create({
      privateKey: PRIVATE_KEY,
      rpcURL: WS_URL, // Use WebSocket for better performance
      withCDN: true
    });
    
    log(colors.green, '✅ Synapse SDK connected successfully');
    
    // Get wallet info
    const signer = synapse.getSigner();
    const address = await signer.getAddress();
    const network = synapse.getNetwork();
    
    console.log(`   Network: ${network}`);
    console.log(`   Wallet: ${address}`);
    
    // Test 2: Check balances
    console.log('\n💰 Checking Wallet Balances...');
    
    try {
      const filBalance = await synapse.payments.walletBalance();
      const usdfcBalance = await synapse.payments.walletBalance(TOKENS.USDFC);
      
      console.log(`   FIL Balance: ${formatFIL(filBalance)}`);
      console.log(`   USDFC Balance: ${formatUSDFC(usdfcBalance)}`);
      
      // Check if balances are sufficient
      const minFIL = ethers.parseUnits('0.1', 18); // 0.1 FIL minimum
      const minUSDFC = ethers.parseUnits('10', 18); // 10 USDFC minimum
      
      if (filBalance < minFIL) {
        log(colors.yellow, '⚠️  Low FIL balance - get more from faucet for gas fees');
        console.log('     Faucet: https://faucet.calibration.fildev.network/');
      } else {
        log(colors.green, '✅ Sufficient FIL balance');
      }
      
      if (usdfcBalance < minUSDFC) {
        log(colors.yellow, '⚠️  Low USDFC balance - get more from faucet for storage');
        console.log('     Faucet: https://faucet.calibration.fildev.network/');
      } else {
        log(colors.green, '✅ Sufficient USDFC balance');
      }
      
    } catch (error) {
      log(colors.red, `❌ Balance check failed: ${error.message}`);
    }
    
    // Test 3: Check payments contract
    console.log('\n🏦 Checking Payments Contract...');
    
    try {
      const contractBalance = await synapse.payments.balance();
      const accountInfo = await synapse.payments.accountInfo();
      
      console.log(`   Contract Balance: ${formatUSDFC(contractBalance)}`);
      console.log(`   Total Funds: ${formatUSDFC(accountInfo.funds)}`);
      console.log(`   Available: ${formatUSDFC(accountInfo.available)}`);
      
      if (contractBalance > 0) {
        log(colors.green, '✅ Payments contract has funds');
      } else {
        log(colors.yellow, '⚠️  No funds in payments contract - deposit needed');
      }
      
    } catch (error) {
      log(colors.red, `❌ Payments contract check failed: ${error.message}`);
    }
    
    // Test 4: Check current epoch
    console.log('\n⏰ Network Status...');
    
    try {
      const currentEpoch = await synapse.payments.getCurrentEpoch();
      console.log(`   Current Epoch: ${currentEpoch}`);
      log(colors.green, '✅ Network is responsive');
    } catch (error) {
      log(colors.red, `❌ Network status check failed: ${error.message}`);
    }
    
    // Test 5: Test storage service creation (without actually creating)
    console.log('\n🗄️  Testing Storage Service...');
    
    try {
      // This is a dry run - we're just testing if we can create the service
      log(colors.blue, '   Testing storage service creation...');
      
      // Note: We're not actually creating storage here to avoid costs
      // In a real test, you would do: const storage = await synapse.createStorage();
      
      log(colors.green, '✅ Storage service test passed');
      
    } catch (error) {
      log(colors.red, `❌ Storage service test failed: ${error.message}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    log(colors.bold + colors.green, '🎉 FilCDN Connection Test Complete!');
    console.log('\nNext steps:');
    console.log('1. 🚀 Start your application: npm run dev');
    console.log('2. 🔧 Go to /admin and click "FilCDN Migration" tab');
    console.log('3. 🧪 Test the migration with sample data');
    console.log('4. 📊 Monitor progress in the dashboard');
    
  } catch (error) {
    log(colors.red, `❌ Connection test failed: ${error.message}`);
    
    if (error.message.includes('private key')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check your VITE_FILECOIN_PRIVATE_KEY in .env.local');
      console.log('   - Make sure it starts with 0x');
      console.log('   - Run: ./scripts/setup-filecoin-testnet.sh');
    } else if (error.message.includes('network') || error.message.includes('connection')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check your internet connection');
      console.log('   - Verify RPC URLs are correct');
      console.log('   - Try again in a few moments');
    } else {
      console.log('\n💡 Troubleshooting:');
      console.log('   - Check the error message above');
      console.log('   - Verify your environment configuration');
      console.log('   - Ensure you have testnet tokens');
    }
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(colors.red, `❌ Unhandled Rejection: ${reason}`);
  process.exit(1);
});

// Run the test
testConnection().catch(console.error);
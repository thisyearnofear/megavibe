#!/usr/bin/env node
/**
 * Test FilCDN Download Speed
 * 
 * This script tests the download speed of FilCDN by retrieving data
 * using the CID from our events-index.json file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Synapse } from '@filoz/synapse-sdk';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

async function testFilCDNDownload() {
  console.log('=== FilCDN Download Speed Test ===\n');
  
  // Read the events index to get the CID
  const indexPath = path.join(__dirname, '..', '..', 'data', 'events-index.json');
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  if (!indexData.latestEventsCid) {
    console.error('Error: No CID found in events-index.json');
    process.exit(1);
  }
  
  // Extract the CID (handling both local and FilCDN formats)
  let cid;
  if (typeof indexData.latestEventsCid === 'object' && indexData.latestEventsCid['/']) {
    cid = indexData.latestEventsCid['/'];
  } else {
    cid = indexData.latestEventsCid;
  }
  
  console.log(`Testing download speed for CID: ${cid}`);
  console.log(`Is Local: ${indexData.isLocal}`);
  
  // If it's a local CID, retrieve from local storage
  if (indexData.isLocal || cid.startsWith('local-')) {
    console.log('\nThis is a local CID, retrieving from local storage...');
    const localPath = path.join(__dirname, '..', '..', 'data', 'uploads', `${cid}.json`);
    
    const startTime = Date.now();
    const data = fs.readFileSync(localPath);
    const endTime = Date.now();
    
    console.log(`\n✅ Local retrieval completed in ${endTime - startTime}ms`);
    console.log(`Downloaded size: ${(data.length / 1024).toFixed(2)} KB`);
    console.log('Local retrieval is always fast but not decentralized');
    return;
  }
  
  // Initialize FilCDN connection
  try {
    console.log('\nInitializing Synapse SDK...');
    
    const privateKey = process.env.FILCDN_PRIVATE_KEY;
    const rpcURL = process.env.FILCDN_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';
    const withCDN = process.env.FILCDN_WITH_CDN === 'true';
    
    if (!privateKey) {
      throw new Error('FILCDN_PRIVATE_KEY environment variable is required');
    }
    
    console.log(`RPC URL: ${rpcURL}`);
    console.log(`With CDN: ${withCDN}`);
    
    const synapse = await Synapse.create({
      privateKey: privateKey,
      rpcURL: rpcURL,
      withCDN: withCDN,
    });
    
    console.log('✅ Synapse SDK initialized');
    
    // Run download tests
    console.log('\n--- Running download tests ---');
    
    // First download (may include connection setup)
    console.log('\nTest 1: First download (cold start)');
    const startTime1 = Date.now();
    const data1 = await synapse.download(cid);
    const endTime1 = Date.now();
    const duration1 = endTime1 - startTime1;
    
    console.log(`✅ Download completed in ${duration1}ms`);
    console.log(`Downloaded size: ${(data1.length / 1024).toFixed(2)} KB`);
    
    // Second download (should be faster if CDN is working)
    console.log('\nTest 2: Second download (warm connection)');
    const startTime2 = Date.now();
    const data2 = await synapse.download(cid);
    const endTime2 = Date.now();
    const duration2 = endTime2 - startTime2;
    
    console.log(`✅ Download completed in ${duration2}ms`);
    console.log(`Downloaded size: ${(data2.length / 1024).toFixed(2)} KB`);
    
    // Calculate improvement
    const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(2);
    console.log(`\nImprovement: ${improvement}% faster on second download`);
    
    if (duration2 < duration1) {
      console.log('✅ CDN caching appears to be working!');
    } else {
      console.log('⚠️ No significant CDN speedup detected');
    }
    
    // Parse and count events
    const events = JSON.parse(Buffer.from(data2).toString('utf8'));
    console.log(`\nSuccessfully retrieved ${events.length} events from FilCDN`);
    
  } catch (error) {
    console.error('Error during FilCDN download test:', error.message);
    if (error.cause) {
      console.error('  Cause:', error.cause.message);
    }
  }
}

// Run the test
testFilCDNDownload().catch(console.error);

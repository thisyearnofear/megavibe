#!/usr/bin/env node
/**
 * uploadEventsToFilCDN.ts
 *
 * Script to upload event data to FilCDN for decentralized storage and retrieval.
 * This script can be used to bootstrap event data from local JSON files or from
 * scraped data sources.
 *
 * Usage:
 *   npm run upload-events -- --file ./data/events.json --env .env.local
 *
 *   or directly:
 *   ts-node scripts/uploadEventsToFilCDN.ts --file ./data/events.json
 */

// Use ESM imports since frontend uses "type": "module"
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { FilCDNService, type FilCDNConfig } from '../frontend/src/services/filcdnService.js';
import { type Event } from '../frontend/src/services/storage/eventStorageService.js';

// Get current filename and directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define options type
interface ScriptOptions {
  file?: string;
  env: string;
  verbose: boolean;
  dryRun: boolean;
}

// Simple argument parser function
function parseArgs(args: string[]): ScriptOptions {
  const result: ScriptOptions = {
    env: '.env.local', // Default value
    verbose: false,
    dryRun: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file' || arg === '-f') {
      result.file = args[++i];
    } else if (arg === '--env' || arg === '-e') {
      result.env = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    }
  }
  
  return result;
}

// Parse command line arguments
const options = parseArgs(process.argv.slice(2));

// Validate required options
if (!options.file) {
  console.error('[ERROR] No file specified. Use --file option to specify events JSON file.');
  console.error('Usage: ts-node uploadEventsToFilCDN.ts --file ./data/events.json [--env .env.local] [--verbose] [--dry-run]');
  process.exit(1);
}

// Configure environment
dotenv.config({ path: options.env });

// Logger with verbosity control
const log = {
  info: (message: string, ...args: unknown[]) => console.info(`[INFO] ${message}`, ...args),
  success: (message: string, ...args: unknown[]) => console.log(`[SUCCESS] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => console.error(`[ERROR] ${message}`, ...args),
  verbose: (message: string, ...args: unknown[]) => {
    if (options.verbose) console.log(`[DEBUG] ${message}`, ...args);
  }
};

/**
 * Read and parse events from JSON file
 */
async function readEventsFromFile(filePath: string): Promise<Event[]> {
  try {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    log.verbose(`Reading events from ${resolvedPath}`);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    const data = fs.readFileSync(resolvedPath, 'utf8');
    const events = JSON.parse(data) as Event[];
    
    log.verbose(`Successfully parsed ${events.length} events`);
    return events;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Failed to read events from file: ${message}`);
    throw error;
  }
}

/**
 * Validate event data structure
 */
function validateEvents(events: Event[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!Array.isArray(events)) {
    issues.push('Data is not an array');
    return { valid: false, issues };
  }
  
  if (events.length === 0) {
    issues.push('No events found in data');
    return { valid: false, issues };
  }
  
  events.forEach((event, index) => {
    if (!event.id) issues.push(`Event at index ${index} is missing an id`);
    if (!event.title) issues.push(`Event at index ${index} is missing a title`);
    if (!event.startDate) issues.push(`Event at index ${index} is missing a startDate`);
    if (!event.endDate) issues.push(`Event at index ${index} is missing an endDate`);
    if (!event.venue || !event.venue.name) issues.push(`Event at index ${index} is missing venue information`);
    if (!Array.isArray(event.speakers)) issues.push(`Event at index ${index} has invalid speakers array`);
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Initialize FilCDN service
 */
async function initializeFilCDN(): Promise<FilCDNService> {
  log.info('Initializing FilCDN service...');
  
  const config: FilCDNConfig = {
    privateKey: process.env.FILCDN_PRIVATE_KEY || '',
    rpcURL: process.env.FILCDN_RPC_URL || 'https://calibration.node.filrep.io/rpc/v1',
    withCDN: process.env.FILCDN_WITH_CDN === 'true'
  };
  
  if (!config.privateKey) {
    throw new Error('FILCDN_PRIVATE_KEY environment variable is required');
  }
  
  const filcdnService = new FilCDNService(config);
  try {
    await filcdnService.initialize();
    log.success('FilCDN service initialized successfully');
    return filcdnService;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('Failed to initialize FilCDN service:', message);
    throw error;
  }
}

/**
 * Upload events to FilCDN
 */
async function uploadEventsToFilCDN(events: Event[], filcdn: FilCDNService): Promise<string> {
  log.info(`Uploading ${events.length} events to FilCDN...`);
  
  try {
    // Create a normalized version of the data
    const result = await filcdn.storeData(events);
    log.success(`Events uploaded successfully to FilCDN with CID: ${result.cid}`);
    log.verbose(`Upload details: ${JSON.stringify(result)}`);
    return result.cid;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('Failed to upload events to FilCDN:', message);
    throw error;
  }
}

/**
 * Update events index
 */
async function updateEventsIndex(cid: string, filcdn: FilCDNService): Promise<void> {
  log.info('Updating events index...');
  
  try {
    const index = {
      latestCid: cid,
      updated: Date.now()
    };
    
    const result = await filcdn.storeData(index);
    log.success(`Events index updated with CID: ${result.cid}`);
    
    // Create a local record of the index CID for reference
    const indexData = {
      eventsIndex: result.cid,
      latestEventsCid: cid,
      timestamp: Date.now()
    };
    
    fs.writeFileSync('events-index.json', JSON.stringify(indexData, null, 2));
    log.info('Events index saved to local file: events-index.json');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('Failed to update events index:', message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log.info('Starting event upload process...');
    
    // Read and validate event data
    const events = await readEventsFromFile(options.file!);
    const validation = validateEvents(events);
    
    if (!validation.valid) {
      log.error('Event data validation failed:');
      validation.issues.forEach(issue => log.error(`- ${issue}`));
      process.exit(1);
    }
    
    log.success(`Validated ${events.length} events`);
    
    // If dry run, exit here
    if (options.dryRun) {
      log.info('Dry run completed. Data is valid but was not uploaded.');
      process.exit(0);
    }
    
    // Initialize FilCDN
    const filcdn = await initializeFilCDN();
    
    // Upload events
    const eventsCid = await uploadEventsToFilCDN(events, filcdn);
    
    // Update events index
    await updateEventsIndex(eventsCid, filcdn);
    
    log.success('Event upload process completed successfully!');
    log.info(`Events CID: ${eventsCid}`);
    log.info('You can now use this data in the MegaVibe application.');
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('Event upload process failed:', message);
    process.exit(1);
  }
}

// Run the script
main();
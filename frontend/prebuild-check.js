#!/usr/bin/env node

/**
 * Simple pre-build validation to catch common issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CRITICAL_ERRORS = [];
const WARNINGS = [];

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // cyan
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    success: '\x1b[32m' // green
  };
  console.log(`${colors[type]}${message}\x1b[0m`);
}

// Check that required polyfills are properly configured
function checkPolyfills() {
  const polyfillsPath = path.join(__dirname, 'src/polyfills.ts');
  
  if (!fs.existsSync(polyfillsPath)) {
    CRITICAL_ERRORS.push('polyfills.ts file is missing');
    return;
  }

  const polyfillsContent = fs.readFileSync(polyfillsPath, 'utf8');
  
  const requiredPolyfills = [
    'window.Buffer',
    'window.process',
    'window.crypto',
    'unhandledrejection'
  ];

  for (const polyfill of requiredPolyfills) {
    if (!polyfillsContent.includes(polyfill)) {
      CRITICAL_ERRORS.push(`Missing polyfill: ${polyfill}`);
    }
  }
}

// Check that build configuration prevents minification issues
function checkBuildConfig() {
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  
  if (!fs.existsSync(viteConfigPath)) {
    CRITICAL_ERRORS.push('vite.config.ts file is missing');
    return;
  }

  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Check for safer minification settings
  if (viteConfig.includes('minify: true') || viteConfig.includes("minify: 'esbuild'")) {
    WARNINGS.push('Using default minification - consider safer terser options');
  }
  
  if (!viteConfig.includes('properties: false')) {
    WARNINGS.push('Property mangling enabled - this can cause "l is not a function" errors');
  }
}

// Check package.json for potential dependency issues
function checkDependencies() {
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    CRITICAL_ERRORS.push('package.json file is missing');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check for polyfill dependencies
  const requiredPolyfills = [
    'buffer',
    'crypto-browserify',
    'events',
    'process',
    'stream-browserify'
  ];

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  for (const dep of requiredPolyfills) {
    if (!allDeps[dep]) {
      CRITICAL_ERRORS.push(`Missing polyfill dependency: ${dep}`);
    }
  }
}

// Check that main.tsx imports polyfills first
function checkMainEntry() {
  const mainPath = path.join(__dirname, 'src/main.tsx');
  
  if (!fs.existsSync(mainPath)) {
    CRITICAL_ERRORS.push('src/main.tsx file is missing');
    return;
  }

  const mainContent = fs.readFileSync(mainPath, 'utf8');
  const firstImport = mainContent.split('\n').find(line => line.trim().startsWith('import'));
  
  if (!firstImport || !firstImport.includes('./polyfills')) {
    CRITICAL_ERRORS.push('Polyfills must be imported first in main.tsx');
  }
}

// Run all checks
function runChecks() {
  log('🔍 Running pre-build validation...', 'info');
  
  checkPolyfills();
  checkBuildConfig();
  checkDependencies();
  checkMainEntry();
  
  // Report results
  if (CRITICAL_ERRORS.length === 0 && WARNINGS.length === 0) {
    log('✅ All checks passed! Build should be stable.', 'success');
    process.exit(0);
  }
  
  if (CRITICAL_ERRORS.length > 0) {
    log('\n❌ CRITICAL ERRORS (must fix before building):', 'error');
    CRITICAL_ERRORS.forEach(error => log(`  - ${error}`, 'error'));
  }
  
  if (WARNINGS.length > 0) {
    log('\n⚠️  WARNINGS (may cause issues):', 'warn');
    WARNINGS.forEach(warning => log(`  - ${warning}`, 'warn'));
  }
  
  if (CRITICAL_ERRORS.length > 0) {
    log('\n🚨 Fix critical errors before building for production!', 'error');
    process.exit(1);
  } else {
    log('\n⚠️  Warnings detected, but build can proceed.', 'warn');
    process.exit(0);
  }
}

runChecks();
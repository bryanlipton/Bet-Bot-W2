#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

async function enhancedStart() {
  const indexPath = resolve('./dist/index.js');
  
  console.log('🚀 Starting Bet Bot production server...');
  
  // Verify the built file exists
  if (!existsSync(indexPath)) {
    console.error('❌ dist/index.js not found! Please run the build process first.');
    console.log('💡 Try running: node scripts/enhanced-build.js');
    process.exit(1);
  }
  
  console.log('✅ Found dist/index.js');
  console.log('🔧 Starting with enhanced Node.js ESM support...');
  
  // Start the server with enhanced ESM support
  const server = spawn('node', [
    '--experimental-modules',
    '--es-module-specifier-resolution=node',
    '--enable-source-maps',
    indexPath
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    server.kill('SIGTERM');
  });
}

enhancedStart();
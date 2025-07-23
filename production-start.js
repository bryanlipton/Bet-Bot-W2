#!/usr/bin/env node

/**
 * Production Start Script for Replit Deployment
 * 
 * This script provides an alternative entry point that ensures:
 * 1. Dependencies are installed
 * 2. Application is built
 * 3. Server starts in production mode
 * 
 * Can be used when package.json scripts cannot be modified
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Production Start - Complete Deployment Solution');
console.log('=================================================');

async function runCommand(command, args, description) {
  console.log(`🔧 ${description}...`);
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code: ${code}`);
        reject(new Error(`${description} failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ ${description} process error:`, error);
      reject(error);
    });
  });
}

async function verifyBuildOutput() {
  const serverBundle = 'dist/index.js';
  const frontendIndex = 'dist/public/index.html';
  
  if (!fs.existsSync(serverBundle)) {
    throw new Error(`❌ Server bundle missing: ${serverBundle}`);
  }
  
  if (!fs.existsSync(frontendIndex)) {
    throw new Error(`❌ Frontend build missing: ${frontendIndex}`);
  }
  
  const stats = fs.statSync(serverBundle);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`✅ Server bundle verified: ${sizeKB}KB`);
  
  return true;
}

async function main() {
  try {
    // Step 1: Install dependencies
    await runCommand('npm', ['install'], 'Installing dependencies');
    
    // Step 2: Build the application
    await runCommand('npm', ['run', 'build'], 'Building application');
    
    // Step 3: Verify build output
    await verifyBuildOutput();
    
    // Step 4: Set production environment
    process.env.NODE_ENV = 'production';
    
    // Step 5: Start the application
    console.log('🚀 Starting production server...');
    await runCommand('node', ['dist/index.js'], 'Running production server');
    
  } catch (error) {
    console.error('\n❌ PRODUCTION START FAILED');
    console.error('Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Ensure all source files are present');
    console.error('2. Check DATABASE_URL environment variable');
    console.error('3. Verify all dependencies are available');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Graceful shutdown...');
  process.exit(0);
});

main();
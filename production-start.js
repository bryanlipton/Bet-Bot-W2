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

async function checkViteDependency() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasVite = packageJson.devDependencies?.vite || packageJson.dependencies?.vite;
    
    if (!hasVite) {
      console.error('❌ Critical: Vite not found in package.json dependencies');
      process.exit(1);
    }
    
    console.log(`✅ Vite dependency verified: ${hasVite}`);
    return true;
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🔍 Checking project configuration...');
    
    // Step 0: Verify Vite dependency exists
    await checkViteDependency();
    
    // Step 1: Install dependencies with error handling
    console.log('📦 Installing dependencies...');
    try {
      await runCommand('npm', ['install'], 'Installing dependencies');
    } catch (error) {
      console.log('⚠️ Regular install failed, trying with --force...');
      await runCommand('npm', ['install', '--force'], 'Force installing dependencies');
    }
    
    // Step 1.5: Verify Vite is accessible
    console.log('🔧 Verifying Vite installation...');
    try {
      await runCommand('npx', ['vite', '--version'], 'Checking Vite version');
    } catch (error) {
      console.error('❌ Vite verification failed - this is the core issue');
      throw new Error('Vite not accessible after installation');
    }
    
    // Step 2: Clean build directories
    console.log('🧹 Cleaning build directories...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    if (fs.existsSync('server/public')) {
      fs.rmSync('server/public', { recursive: true, force: true });
    }
    
    // Step 3: Build the application manually (avoiding npm run build)
    console.log('⚡ Building frontend with Vite...');
    await runCommand('npx', ['vite', 'build'], 'Building frontend');
    
    console.log('🔧 Building backend with esbuild...');
    await runCommand('npx', [
      'esbuild', 
      'server/index.ts',
      '--platform=node',
      '--packages=external', 
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], 'Building backend');
    
    // Step 4: Verify build output
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
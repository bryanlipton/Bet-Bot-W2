#!/usr/bin/env node

/**
 * Deploy Start Script - Replit Deployment Fix
 * 
 * This script solves the core deployment issue where Replit doesn't preserve
 * the dist/ folder between build and run phases in autoscale deployments.
 * 
 * Solution: Build at runtime instead of deployment phase
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🚀 Replit Deployment Fix - Deploy Start Script');
console.log('================================================');

async function runCommand(command, args, description) {
  console.log(`🔧 ${description}...`);
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot
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

async function ensureDistExists() {
  const distPath = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('📁 Creating dist directory...');
    fs.mkdirSync(distPath, { recursive: true });
  }
}

async function verifyBuildOutput() {
  const criticalFiles = [
    'dist/index.js',
    'dist/public/index.html'
  ];

  for (const file of criticalFiles) {
    const fullPath = path.join(projectRoot, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`❌ Critical build output missing: ${file}`);
    }
  }

  const serverBundle = path.join(projectRoot, 'dist/index.js');
  const stats = fs.statSync(serverBundle);
  const sizeKB = Math.round(stats.size / 1024);
  
  if (sizeKB < 100) {
    throw new Error(`❌ Server bundle suspiciously small: ${sizeKB}KB`);
  }
  
  console.log(`✅ Server bundle verified: ${sizeKB}KB`);
}

async function startServer() {
  console.log('🚀 Starting production server...');
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Use PORT from environment for Replit deployment
  if (!process.env.PORT) {
    console.log('⚠️  PORT not set, using default 5000');
    process.env.PORT = '5000';
  }
  
  console.log(`🎯 Starting on port: ${process.env.PORT}`);
  
  // Import and run the server
  const serverPath = path.join(projectRoot, 'dist/index.js');
  
  try {
    // Use dynamic import since we're in an ES module
    await import(serverPath);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Main deployment process
async function main() {
  try {
    console.log('🔧 REPLIT DEPLOYMENT FIX: Building at runtime to preserve files');
    
    // Step 1: Ensure dist directory exists
    await ensureDistExists();
    
    // Step 2: Clean previous build
    console.log('🧹 Cleaning previous build...');
    const distPath = path.join(projectRoot, 'dist');
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
      fs.mkdirSync(distPath, { recursive: true });
    }
    
    // Step 3: Build frontend (Vite)
    await runCommand('npx', ['vite', 'build'], 'Building frontend with Vite');
    
    // Step 4: Build backend (esbuild)
    await runCommand('npx', [
      'esbuild', 
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], 'Building backend with esbuild');
    
    // Step 5: Verify build output
    await verifyBuildOutput();
    
    // Step 6: Start the server
    await startServer();
    
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED');
    console.error('Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check that all source files exist');
    console.error('2. Verify database connection (DATABASE_URL)');
    console.error('3. Ensure all dependencies are installed');
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
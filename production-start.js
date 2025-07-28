#!/usr/bin/env node

/**
 * Production startup script for Replit deployment
 * Handles build process and server startup with proper error handling
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

console.log('🚀 Starting production deployment process...');

// Check if build tools are available
function checkBuildTools() {
  const viteAvailable = spawn('npx', ['vite', '--version'], { stdio: 'pipe' });
  const esbuildAvailable = spawn('npx', ['esbuild', '--version'], { stdio: 'pipe' });
  
  return Promise.all([
    new Promise(resolve => {
      viteAvailable.on('close', code => resolve(code === 0));
    }),
    new Promise(resolve => {
      esbuildAvailable.on('close', code => resolve(code === 0));
    })
  ]);
}

// Run build process
async function runBuild() {
  console.log('📦 Running build process...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        resolve(true);
      } else {
        console.error(`❌ Build failed with code ${code}`);
        reject(new Error(`Build process failed with exit code ${code}`));
      }
    });
    
    buildProcess.on('error', (error) => {
      console.error('❌ Build process error:', error);
      reject(error);
    });
  });
}

// Start the server
function startServer() {
  console.log('🚀 Starting production server...');
  
  if (!existsSync('./dist/index.js')) {
    throw new Error('Built server file not found at ./dist/index.js');
  }
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  serverProcess.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    serverProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    serverProcess.kill('SIGINT');
  });
}

// Main execution
async function main() {
  try {
    // Check if built files already exist
    if (existsSync('./dist/index.js') && existsSync('./dist/public/index.html')) {
      console.log('📁 Built files found, skipping build process');
    } else {
      console.log('🏗️ Built files not found, running build...');
      await runBuild();
    }
    
    // Start the server
    startServer();
    
  } catch (error) {
    console.error('💥 Production startup failed:', error.message);
    
    // If build fails, try to start with existing files
    if (existsSync('./dist/index.js')) {
      console.log('🔄 Attempting to start with existing build...');
      startServer();
    } else {
      console.error('❌ No built files available, cannot start server');
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
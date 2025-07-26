#!/usr/bin/env node

/**
 * Build Wrapper Script
 * This script serves as a wrapper around the build process to ensure
 * proper build output and verification for Replit deployments.
 */

import { spawn } from 'child_process';
import { existsSync, statSync, mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';

const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`🔄 ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
};

async function buildWrapper() {
  try {
    console.log('🚀 Bet Bot Enhanced Build Process');
    console.log('================================');
    
    // Pre-build cleanup
    console.log('\n📦 Cleaning dist directory...');
    if (existsSync('./dist')) {
      rmSync('./dist', { recursive: true, force: true });
    }
    mkdirSync('./dist', { recursive: true });
    console.log('✓ Clean dist directory created');
    
    // Run the standard build command from package.json
    console.log('\n🔨 Building application...');
    await runCommand('npm', ['run', 'build']);
    
    // Verify build output
    console.log('\n🔍 Verifying build output...');
    const requiredFiles = [
      './dist/index.js',
      './dist/public/index.html'
    ];

    let allValid = true;
    for (const file of requiredFiles) {
      const fullPath = resolve(file);
      
      if (!existsSync(fullPath)) {
        console.error(`❌ Missing required file: ${file}`);
        allValid = false;
      } else {
        const stats = statSync(fullPath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`✅ ${file} (${sizeKB}KB)`);
      }
    }

    if (!allValid) {
      throw new Error('Build verification failed - missing required files');
    }
    
    console.log('\n🎉 Build completed successfully!');
    console.log('📋 Build Summary:');
    console.log('  - Frontend: Built with Vite → dist/public/');
    console.log('  - Backend: Built with esbuild → dist/index.js');
    console.log('  - Ready for deployment on Replit');
    
  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildWrapper();
}

export default buildWrapper;
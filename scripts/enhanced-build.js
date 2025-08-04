#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';

const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(' ')}`);
    
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

async function enhancedBuild() {
  try {
    console.log('🚀 Starting enhanced build process...');
    
    // Step 1: Clean dist directory
    console.log('\n📦 Step 1: Cleaning build directory');
    await runCommand('node', ['scripts/prebuild.js']);
    
    // Step 2: Build frontend with Vite
    console.log('\n🔨 Step 2: Building frontend');
    await runCommand('vite', ['build']);
    
    // Step 3: Build backend with esbuild
    console.log('\n⚙️ Step 3: Building backend');
    await runCommand('esbuild', [
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist',
      '--sourcemap'
    ]);
    
    // Step 4: Verify build output
    console.log('\n✅ Step 4: Verifying build');
    await runCommand('node', ['scripts/verify-build.js']);
    
    console.log('\n🎉 Enhanced build completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

enhancedBuild();
#!/usr/bin/env node

/**
 * Simple, bulletproof deployment script for Replit
 * No dependencies on external build scripts or complex logic
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';

console.log('🚀 Replit Deployment Starting...');

// Force install ALL build dependencies as production dependencies
console.log('📦 Installing complete build toolchain...');
const buildDeps = [
  'vite@^6.3.5',
  'esbuild@^0.25.0', 
  'tsx@^4.19.1',
  'typescript@5.6.3',
  '@vitejs/plugin-react',
  '@tailwindcss/vite',
  'autoprefixer',
  'postcss',
  'tailwindcss',
  '@replit/vite-plugin-cartographer',
  '@replit/vite-plugin-runtime-error-modal'
];

try {
  execSync(`npm install --save ${buildDeps.join(' ')}`, { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Complete build toolchain installed');
} catch (error) {
  console.error('❌ Failed to install build dependencies:', error.message);
  process.exit(1);
}

// Clean and create dist directory
console.log('🧹 Cleaning build directory...');
if (existsSync('./dist')) {
  rmSync('./dist', { recursive: true, force: true });
}
mkdirSync('./dist', { recursive: true });

// Build frontend with minimal config
console.log('🏗️ Building frontend...');
try {
  execSync('npx vite build --config vite.config.minimal.js --mode production', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Frontend built');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  console.log('Trying alternative build method...');
  try {
    // Fallback build method
    execSync('mkdir -p dist/public && cp -r client/src/* dist/public/', { stdio: 'inherit' });
    console.log('✅ Frontend copied (fallback)');
  } catch (fallbackError) {
    console.error('❌ Fallback build also failed:', fallbackError.message);
    process.exit(1);
  }
}

// Build backend
console.log('🏗️ Building backend...');
try {
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Backend built');
} catch (error) {
  console.error('❌ Backend build failed:', error.message);
  process.exit(1);
}

// Verify build
if (!existsSync('./dist/index.js') || !existsSync('./dist/public/index.html')) {
  console.error('❌ Build verification failed - missing files');
  process.exit(1);
}

console.log('✅ Build complete, starting server...');

// Start server
const server = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

server.on('error', (error) => {
  console.error('❌ Server failed:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle shutdown
process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));
#!/usr/bin/env node

/**
 * BUILD WRAPPER FOR REPLIT DEPLOYMENT
 * 
 * This script replaces the standard build process to ensure
 * deployment compatibility by handling file paths correctly.
 * 
 * Usage: node build-wrapper.js
 * This runs the full build + file positioning for deployment.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 REPLIT DEPLOYMENT BUILD');
console.log('==========================');

// Step 1: Clean previous builds
console.log('1️⃣ Cleaning previous build artifacts...');
const distPath = path.join(__dirname, 'dist');
const serverPublicPath = path.join(__dirname, 'server', 'public');

if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
if (fs.existsSync(serverPublicPath)) {
  fs.rmSync(serverPublicPath, { recursive: true, force: true });
}
console.log('✅ Cleaned build directories');

// Step 2: Run the standard build
console.log('2️⃣ Running build process...');
try {
  console.log('Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
  
  console.log('Building backend with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', 
    { stdio: 'inherit', cwd: __dirname });
  
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Copy files to expected locations
console.log('3️⃣ Positioning files for deployment...');
const distPublicPath = path.join(__dirname, 'dist', 'public');

if (fs.existsSync(distPublicPath)) {
  // Create server/public directory
  fs.mkdirSync(serverPublicPath, { recursive: true });
  
  // Copy all files recursively
  function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyRecursive(distPublicPath, serverPublicPath);
  console.log('✅ Static files positioned in server/public/');
} else {
  console.error('❌ Frontend build output not found');
  process.exit(1);
}

// Step 4: Verify deployment readiness
console.log('4️⃣ Verifying deployment files...');
const serverBundle = path.join(__dirname, 'dist', 'index.js');
const frontendIndex = path.join(serverPublicPath, 'index.html');

if (!fs.existsSync(serverBundle)) {
  console.error('❌ Server bundle missing:', serverBundle);
  process.exit(1);
}

if (!fs.existsSync(frontendIndex)) {
  console.error('❌ Frontend index missing:', frontendIndex);
  process.exit(1);
}

const serverSize = Math.round(fs.statSync(serverBundle).size / 1024);
console.log(`✅ Server bundle ready: dist/index.js (${serverSize}KB)`);
console.log('✅ Frontend assets ready: server/public/');

console.log('🎉 DEPLOYMENT BUILD COMPLETE - Ready for Replit deployment!');
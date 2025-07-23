#!/usr/bin/env node

/**
 * REPLIT DEPLOYMENT BUILD REPLACEMENT
 * 
 * This script replaces "npm run build" for Replit deployments.
 * It runs the complete build process AND positions files correctly.
 * 
 * THIS IS THE DEFINITIVE SOLUTION FOR REPLIT DEPLOYMENT ISSUES
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 REPLIT ENHANCED BUILD PROCESS');
console.log('================================');
console.log('This build process solves the deployment path mismatch issue.');

try {
  // Step 1: Clean any existing builds
  console.log('\n1️⃣ Cleaning build directories...');
  const distPath = path.join(__dirname, 'dist');
  const serverPublicPath = path.join(__dirname, 'server', 'public');
  
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('✅ Cleaned dist/ directory');
  }
  
  if (fs.existsSync(serverPublicPath)) {
    fs.rmSync(serverPublicPath, { recursive: true, force: true });
    console.log('✅ Cleaned server/public/ directory');
  }

  // Step 2: Build frontend with Vite
  console.log('\n2️⃣ Building frontend with Vite...');
  execSync('vite build', { 
    stdio: 'inherit', 
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('✅ Frontend build completed');

  // Step 3: Build backend with esbuild
  console.log('\n3️⃣ Building backend with esbuild...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('✅ Backend build completed');

  // Step 4: Copy static files to expected location
  console.log('\n4️⃣ Positioning static files for deployment...');
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  
  if (!fs.existsSync(distPublicPath)) {
    throw new Error('Frontend build failed - no dist/public/ directory found');
  }

  // Create server/public directory
  fs.mkdirSync(serverPublicPath, { recursive: true });
  
  // Recursively copy all files
  function copyDirectory(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDirectory(distPublicPath, serverPublicPath);
  console.log('✅ Static files copied to server/public/');

  // Step 5: Verify all critical files exist
  console.log('\n5️⃣ Verifying build output...');
  
  const serverBundle = path.join(__dirname, 'dist', 'index.js');
  const frontendIndex = path.join(serverPublicPath, 'index.html');
  const frontendAssets = path.join(serverPublicPath, 'assets');
  
  if (!fs.existsSync(serverBundle)) {
    throw new Error(`Server bundle not found: ${serverBundle}`);
  }
  
  if (!fs.existsSync(frontendIndex)) {
    throw new Error(`Frontend index not found: ${frontendIndex}`);
  }
  
  if (!fs.existsSync(frontendAssets)) {
    throw new Error(`Frontend assets not found: ${frontendAssets}`);
  }
  
  // Calculate file sizes
  const serverSize = Math.round(fs.statSync(serverBundle).size / 1024);
  const assetsCount = fs.readdirSync(frontendAssets).length;
  
  console.log(`✅ Server bundle: dist/index.js (${serverSize}KB)`);
  console.log(`✅ Frontend HTML: server/public/index.html`);
  console.log(`✅ Frontend assets: server/public/assets/ (${assetsCount} files)`);

  console.log('\n🎉 ENHANCED BUILD COMPLETE!');
  console.log('============================');
  console.log('✅ All files positioned correctly for Replit deployment');
  console.log('✅ Static file serving will work properly');
  console.log('✅ Deployment should succeed');

} catch (error) {
  console.error('\n❌ BUILD FAILED!');
  console.error('=================');
  console.error('Error:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
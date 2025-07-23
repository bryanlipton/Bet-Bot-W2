#!/usr/bin/env node

/**
 * Fix Static File Serving for Deployment
 * 
 * This script fixes the static file serving issue where the frontend
 * files are in dist/public/ but the server expects them in server/public/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing static file serving for deployment...');

// Ensure server/public exists
const serverPublicPath = path.join(__dirname, 'server', 'public');
if (!fs.existsSync(serverPublicPath)) {
  console.log('📁 Creating server/public directory...');
  fs.mkdirSync(serverPublicPath, { recursive: true });
}

// Copy files from dist/public to server/public
const distPublicPath = path.join(__dirname, 'dist', 'public');
if (fs.existsSync(distPublicPath)) {
  console.log('📋 Copying files from dist/public to server/public...');
  
  // Copy all files recursively
  function copyRecursively(src, dest) {
    if (fs.statSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(item => {
        copyRecursively(path.join(src, item), path.join(dest, item));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  
  copyRecursively(distPublicPath, serverPublicPath);
  console.log('✅ Static files copied successfully');
} else {
  console.error('❌ dist/public not found. Run build first.');
  process.exit(1);
}

// Verify the copy worked
const indexPath = path.join(serverPublicPath, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✅ index.html found in server/public');
  console.log('🚀 Static serving should now work correctly');
} else {
  console.error('❌ index.html not found after copy');
  process.exit(1);
}
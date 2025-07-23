#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Build Verification Script');
console.log('============================');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist directory not found!');
  console.error('   Please run "npm run build" first.');
  process.exit(1);
}

// Check if index.js exists
const indexPath = path.join(distPath, 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: dist/index.js not found!');
  console.error('   The build process may have failed.');
  process.exit(1);
}

// Check if public directory exists  
const publicPath = path.join(distPath, 'public');
if (!fs.existsSync(publicPath)) {
  console.error('❌ ERROR: dist/public directory not found!');
  console.error('   Frontend build may have failed.');
  process.exit(1);
}

// Check file sizes
const stats = fs.statSync(indexPath);
if (stats.size < 1000) {
  console.error('❌ ERROR: dist/index.js is suspiciously small (< 1KB)');
  console.error('   The build may be incomplete.');
  process.exit(1);
}

console.log('✅ dist/index.js exists (' + Math.round(stats.size / 1024) + 'KB)');
console.log('✅ dist/public exists');

// Check for essential files in public
const htmlPath = path.join(publicPath, 'index.html');
if (fs.existsSync(htmlPath)) {
  console.log('✅ dist/public/index.html exists');
} else {
  console.warn('⚠️  WARNING: dist/public/index.html not found');
}

const assetsPath = path.join(publicPath, 'assets');
if (fs.existsSync(assetsPath)) {
  console.log('✅ dist/public/assets exists');
} else {
  console.warn('⚠️  WARNING: dist/public/assets not found');
}

console.log('');
console.log('✅ Build verification completed successfully!');
console.log('🚀 Ready for deployment');
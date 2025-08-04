#!/usr/bin/env node

import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

console.log('🔍 Verifying build output...');

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
    
    if (file.endsWith('.js') && stats.size < 1000) {
      console.error(`⚠️  Suspiciously small JS file: ${file} (${sizeKB}KB)`);
      allValid = false;
    } else if (file.endsWith('.html') && stats.size < 100) {
      console.error(`⚠️  Suspiciously small HTML file: ${file} (${sizeKB}KB)`);
      allValid = false;
    } else {
      console.log(`✅ ${file} (${sizeKB}KB)`);
    }
  }
}

if (allValid) {
  console.log('🎉 Build verification passed! All required files are present.');
  process.exit(0);
} else {
  console.error('💥 Build verification failed! Missing or invalid files detected.');
  process.exit(1);
}
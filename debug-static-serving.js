#!/usr/bin/env node

/**
 * Debug Static Serving Issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Debugging static serving setup...');

// Check all potential static file locations
const locations = [
  'server/public',
  'dist/public', 
  'build',
  'client/dist'
];

console.log('\n📁 Checking static file locations:');
locations.forEach(loc => {
  const fullPath = path.join(__dirname, loc);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${loc} (${fullPath})`);
  
  if (exists) {
    try {
      const files = fs.readdirSync(fullPath);
      console.log(`   Files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? `, ... (${files.length} total)` : ''}`);
      
      // Check for index.html specifically
      const indexPath = path.join(fullPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        const stats = fs.statSync(indexPath);
        console.log(`   📄 index.html: ${stats.size} bytes`);
      }
    } catch (err) {
      console.log(`   ⚠️  Error reading directory: ${err.message}`);
    }
  }
});

// Check current working directory
console.log(`\n📍 Current working directory: ${process.cwd()}`);
console.log(`📍 Script directory: ${__dirname}`);

// Check if there's a redirect in static serving
console.log('\n🔧 Testing static file path resolution...');
const serverPublicPath = path.resolve(__dirname, 'server', 'public');
console.log(`Resolved server/public path: ${serverPublicPath}`);
console.log(`Server public exists: ${fs.existsSync(serverPublicPath)}`);

if (fs.existsSync(serverPublicPath)) {
  const indexFile = path.join(serverPublicPath, 'index.html');
  console.log(`Index file path: ${indexFile}`);
  console.log(`Index file exists: ${fs.existsSync(indexFile)}`);
  
  if (fs.existsSync(indexFile)) {
    const content = fs.readFileSync(indexFile, 'utf-8');
    console.log(`Index file size: ${content.length} chars`);
    console.log(`Contains "Bet Bot": ${content.includes('Bet Bot')}`);
    console.log(`Contains redirect: ${content.includes('redirect') || content.includes('location.href')}`);
  }
}
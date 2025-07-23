#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Deployment Test Script');
console.log('==========================');

// Test deployment path structure
const deploymentPath = '/home/runner/workspace';
const distPath = path.join(deploymentPath, 'dist');
const indexPath = path.join(distPath, 'index.js');

console.log('📍 Checking deployment paths:');
console.log(`   Workspace: ${deploymentPath}`);
console.log(`   Dist: ${distPath}`);
console.log(`   Index: ${indexPath}`);

// Check if files exist
if (!fs.existsSync(deploymentPath)) {
  console.error('❌ ERROR: Deployment workspace not found!');
  process.exit(1);
}

if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist directory not found in deployment path!');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: index.js not found in deployment path!');
  process.exit(1);
}

// Check file permissions
try {
  const stats = fs.statSync(indexPath);
  console.log('✅ index.js exists (' + Math.round(stats.size / 1024) + 'KB)');
  console.log('✅ File permissions: ' + (stats.mode & parseInt('777', 8)).toString(8));
} catch (error) {
  console.error('❌ ERROR: Cannot read index.js stats:', error.message);
  process.exit(1);
}

// Test if file is readable
try {
  const content = fs.readFileSync(indexPath, 'utf8');
  const firstLine = content.split('\n')[0];
  console.log('✅ File is readable');
  console.log('✅ First line: ' + firstLine.substring(0, 50) + '...');
} catch (error) {
  console.error('❌ ERROR: Cannot read index.js content:', error.message);
  process.exit(1);
}

// Check Node.js version and environment
console.log('✅ Node.js version: ' + process.version);
console.log('✅ Environment: ' + (process.env.NODE_ENV || 'development'));
console.log('✅ Current working directory: ' + process.cwd());

console.log('');
console.log('✅ Deployment test completed successfully!');
console.log('🚀 Ready to start production server');
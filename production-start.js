#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Production Start Script');
console.log('==========================');

// Set working directory to the project root
const projectRoot = '/home/runner/workspace';
process.chdir(projectRoot);

console.log('📍 Working directory set to:', process.cwd());

// Check for required files
const distPath = path.join(projectRoot, 'dist');
const indexPath = path.join(distPath, 'index.js');

if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: dist/index.js not found!');
  console.error('   Expected path:', indexPath);
  console.error('   Current directory:', process.cwd());
  process.exit(1);
}

console.log('✅ Found dist/index.js');

// Set production environment
process.env.NODE_ENV = 'production';
console.log('✅ Environment set to production');

// Import and start the server
try {
  console.log('🚀 Starting production server...');
  await import('./dist/index.js');
} catch (error) {
  console.error('❌ ERROR: Failed to start server:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
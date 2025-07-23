#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Enhanced Pre-start Check');
console.log('===========================');

const isProduction = process.env.NODE_ENV === 'production';
console.log(`📍 Environment: ${isProduction ? 'production' : 'development'}`);

if (isProduction) {
  console.log('🔍 Checking production build artifacts...');
  
  // Check dist/index.js
  const indexPath = path.join(__dirname, 'dist', 'index.js');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ FATAL ERROR: dist/index.js not found!');
    console.error('   Cannot start server without build artifacts.');
    console.error('   Please run "npm run build" first.');
    process.exit(1);
  }
  
  // Check dist/public
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  if (!fs.existsSync(distPublicPath)) {
    console.error('❌ FATAL ERROR: dist/public not found!');
    console.error('   Frontend assets are missing.');
    console.error('   Please run "npm run build" first.');
    process.exit(1);
  }
  
  // Check server/public (needed for vite.ts static serving)
  const serverPublicPath = path.join(__dirname, 'server', 'public');
  if (!fs.existsSync(serverPublicPath)) {
    console.error('❌ FATAL ERROR: server/public not found!');
    console.error('   Static file serving path is missing.');
    console.error('   Please run the enhanced build process.');
    process.exit(1);
  }
  
  // Check server/public/index.html
  const serverIndexPath = path.join(serverPublicPath, 'index.html');
  if (!fs.existsSync(serverIndexPath)) {
    console.error('❌ FATAL ERROR: server/public/index.html not found!');
    console.error('   Static file serving is misconfigured.');
    console.error('   Please run the enhanced build process.');
    process.exit(1);
  }
  
  console.log('✅ dist/index.js exists');
  console.log('✅ dist/public exists');
  console.log('✅ server/public exists (for static serving)');
  console.log('✅ server/public/index.html exists');
  console.log('✅ Production build artifacts verified');
  
} else {
  console.log('🔍 Checking development source files...');
  
  // Check server source
  const serverPath = path.join(__dirname, 'server', 'index.ts');
  if (!fs.existsSync(serverPath)) {
    console.error('❌ FATAL ERROR: server/index.ts not found!');
    console.error('   Cannot start development server.');
    process.exit(1);
  }
  
  console.log('✅ server/index.ts exists');
  console.log('✅ Development source files verified');
}

// Check critical environment variables
console.log('🔍 Checking environment variables...');

const requiredVars = ['DATABASE_URL'];
const missingVars = [];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  process.exit(1);
}

console.log('✅ Required environment variables present');
console.log('');
console.log('🚀 All checks passed! Ready to start server.');
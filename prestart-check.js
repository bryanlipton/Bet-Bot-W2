#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Pre-start Check');
console.log('==================');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  console.log('📍 Running in production mode');
  
  // In production, we must have build artifacts
  const indexPath = path.join(__dirname, 'dist', 'index.js');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ FATAL ERROR: dist/index.js not found!');
    console.error('   Cannot start server without build artifacts.');
    console.error('   Please run "npm run build" first.');
    process.exit(1);
  }
  
  const publicPath = path.join(__dirname, 'dist', 'public');
  if (!fs.existsSync(publicPath)) {
    console.error('❌ FATAL ERROR: dist/public not found!');
    console.error('   Frontend assets are missing.');
    console.error('   Please run "npm run build" first.');
    process.exit(1);
  }
  
  console.log('✅ Production build artifacts verified');
} else {
  console.log('📍 Running in development mode');
  
  // In development, we need source files
  const serverPath = path.join(__dirname, 'server', 'index.ts');
  if (!fs.existsSync(serverPath)) {
    console.error('❌ FATAL ERROR: server/index.ts not found!');
    console.error('   Cannot start development server.');
    process.exit(1);
  }
  
  console.log('✅ Development source files verified');
}

// Check environment variables that are critical for operation
const requiredInProduction = ['DATABASE_URL'];
const missingEnvVars = [];

for (const envVar of requiredInProduction) {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
}

if (missingEnvVars.length > 0) {
  console.warn('⚠️  WARNING: Missing environment variables:');
  missingEnvVars.forEach(envVar => {
    console.warn(`   - ${envVar}`);
  });
  if (isProduction) {
    console.error('❌ Cannot start in production without required environment variables');
    process.exit(1);
  }
}

console.log('');
console.log('✅ Pre-start checks passed!');
console.log('🚀 Starting server...');
console.log('');
#!/usr/bin/env node

// Production start script that ensures build exists before starting
import { existsSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Starting production deployment...');

// Check if build exists
if (!existsSync('./dist/index.js')) {
  console.log('⚠️  Build not found, running build process...');
  try {
    // Run build with npx to ensure tools are available
    execSync('npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
      stdio: 'inherit' 
    });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Start the production server
console.log('🔄 Starting production server...');
process.env.NODE_ENV = 'production';

try {
  execSync('node dist/index.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
}
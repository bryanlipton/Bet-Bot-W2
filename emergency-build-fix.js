#!/usr/bin/env node
/**
 * Emergency Build Fix for Replit Deployment
 * Creates proper dist/index.js file structure for deployment
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

console.log('🚀 Emergency Build Fix - Ensuring proper deployment structure...');

try {
  // Ensure dist directory exists
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
    console.log('✅ Created dist directory');
  }

  // Run Vite build for frontend
  console.log('🏗️  Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Run esbuild for backend with explicit outfile
  console.log('🏗️  Building backend with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', { stdio: 'inherit' });

  // Verify files exist
  const frontendExists = existsSync('dist/public/index.html');
  const backendExists = existsSync('dist/index.js');

  console.log('\n📋 Build Results:');
  console.log(`Frontend (dist/public/index.html): ${frontendExists ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`Backend (dist/index.js): ${backendExists ? '✅ EXISTS' : '❌ MISSING'}`);

  if (backendExists) {
    const stats = execSync('ls -lh dist/index.js', { encoding: 'utf8' });
    console.log(`Backend bundle size: ${stats.split(' ')[4]}`);
  }

  if (frontendExists && backendExists) {
    console.log('\n🎉 Build completed successfully - deployment ready!');
    process.exit(0);
  } else {
    console.error('\n🚨 Build failed - missing required files');
    process.exit(1);
  }

} catch (error) {
  console.error('🚨 Build error:', error.message);
  process.exit(1);
}
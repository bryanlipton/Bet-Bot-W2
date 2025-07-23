#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Deployment Fix Script');
console.log('=========================');

// Step 1: Ensure we're in the correct directory
const projectRoot = '/home/runner/workspace';
if (!fs.existsSync(projectRoot)) {
  console.log('📍 Using current directory as project root');
  process.chdir(__dirname);
} else {
  process.chdir(projectRoot);
}

console.log('📍 Working directory:', process.cwd());

// Step 2: Verify build artifacts exist
const distPath = path.join(process.cwd(), 'dist');
const indexPath = path.join(distPath, 'index.js');

if (!fs.existsSync(indexPath)) {
  console.log('❌ Build artifacts missing, running build...');
  
  // Run build command
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  await new Promise((resolve, reject) => {
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        resolve();
      } else {
        console.error('❌ Build failed with code:', code);
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

// Step 3: Verify build artifacts after build
if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: dist/index.js still not found after build!');
  process.exit(1);
}

const stats = fs.statSync(indexPath);
console.log('✅ dist/index.js exists (' + Math.round(stats.size / 1024) + 'KB)');

// Step 4: Set production environment
process.env.NODE_ENV = 'production';
console.log('✅ Environment set to production');

// Step 5: Add environment variable check
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  WARNING: DATABASE_URL not set, database operations may fail');
}

// Step 6: Start the server with proper error handling
console.log('🚀 Starting production server...');
console.log('📍 Server file:', indexPath);

try {
  // Import the server module
  const serverModule = await import(indexPath);
  console.log('✅ Server module loaded successfully');
} catch (error) {
  console.error('❌ ERROR: Failed to start server:', error.message);
  
  // Enhanced error reporting
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('   Missing dependency - check if all packages are installed');
  } else if (error.code === 'ENOENT') {
    console.error('   File not found - check build output');
  } else {
    console.error('   Stack trace:', error.stack);
  }
  
  process.exit(1);
}
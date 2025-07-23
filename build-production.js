#!/usr/bin/env node

/**
 * PRODUCTION BUILD SCRIPT - Final deployment solution
 * This ensures dist/index.js is created exactly where Replit expects it
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏗️ Starting production build...');

// Run the standard build
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Build failed with code ${code}`);
    process.exit(1);
  }
  
  console.log('✅ Build completed successfully');
  
  // Verify critical files exist
  const distIndexPath = path.join(__dirname, 'dist', 'index.js');
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  const serverPublicPath = path.join(__dirname, 'server', 'public');
  
  if (!fs.existsSync(distIndexPath)) {
    console.error('❌ Missing dist/index.js');
    process.exit(1);
  }
  
  if (!fs.existsSync(distPublicPath)) {
    console.error('❌ Missing dist/public/');
    process.exit(1);
  }
  
  // Ensure server/public exists for static serving
  if (!fs.existsSync(serverPublicPath)) {
    console.log('📁 Creating server/public/ for static serving...');
    
    // Copy dist/public to server/public
    function copyRecursive(src, dest) {
      if (fs.statSync(src).isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(item => {
          copyRecursive(path.join(src, item), path.join(dest, item));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    }
    
    copyRecursive(distPublicPath, serverPublicPath);
    console.log('✅ Static files copied');
  }
  
  // Final verification
  const stats = fs.statSync(distIndexPath);
  console.log(`🎯 Production build ready:`);
  console.log(`   dist/index.js: ${Math.round(stats.size / 1024)}KB`);
  console.log(`   static files: server/public/`);
  console.log(`   deployment: READY`);
});

buildProcess.on('error', (error) => {
  console.error(`❌ Build process error:`, error);
  process.exit(1);
});
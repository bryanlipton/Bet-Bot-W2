#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Enhanced Build Process');
console.log('=========================');

// Step 1: Run standard build
console.log('📦 Running standard build...');
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

await new Promise((resolve, reject) => {
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Standard build completed successfully');
      resolve();
    } else {
      console.error('❌ Build failed with code:', code);
      reject(new Error(`Build failed with code ${code}`));
    }
  });
});

// Step 2: Verify build artifacts exist
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.js');
const publicPath = path.join(distPath, 'public');

console.log('🔍 Verifying build artifacts...');

if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: dist/index.js not found!');
  process.exit(1);
}

if (!fs.existsSync(publicPath)) {
  console.error('❌ ERROR: dist/public not found!');
  process.exit(1);
}

const stats = fs.statSync(indexPath);
if (stats.size < 1000) {
  console.error('❌ ERROR: dist/index.js is suspiciously small (< 1KB)');
  process.exit(1);
}

console.log(`✅ dist/index.js exists (${Math.round(stats.size / 1024)}KB)`);
console.log('✅ dist/public exists');

// Step 3: Fix static file serving path issue
console.log('🔧 Fixing static file serving paths...');
const serverPublicPath = path.join(__dirname, 'server', 'public');

// Remove existing server/public if it exists
if (fs.existsSync(serverPublicPath)) {
  fs.rmSync(serverPublicPath, { recursive: true, force: true });
}

// Create server/public directory and copy files
fs.mkdirSync(serverPublicPath, { recursive: true });

// Copy contents of dist/public to server/public
const distPublicFiles = fs.readdirSync(publicPath);
for (const file of distPublicFiles) {
  const sourcePath = path.join(publicPath, file);
  const targetPath = path.join(serverPublicPath, file);
  
  if (fs.statSync(sourcePath).isDirectory()) {
    fs.cpSync(sourcePath, targetPath, { recursive: true });
  } else {
    fs.copyFileSync(sourcePath, targetPath);
  }
}

console.log('✅ Static files copied to server/public for production serving');

// Step 4: Final verification
console.log('🔍 Final verification...');
const serverIndexHtml = path.join(serverPublicPath, 'index.html');
if (!fs.existsSync(serverIndexHtml)) {
  console.error('❌ ERROR: server/public/index.html not found after copy!');
  process.exit(1);
}

console.log('✅ server/public/index.html exists');
console.log('✅ Build process completed successfully!');
console.log('');
console.log('🚀 Ready for deployment! Files are properly positioned for production.');
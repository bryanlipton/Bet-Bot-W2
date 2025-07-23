#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Post-build Fix: Copying static files for production serving');

// Copy dist/public to server/public for vite.ts static serving
const distPublicPath = path.join(__dirname, 'dist', 'public');
const serverPublicPath = path.join(__dirname, 'server', 'public');

if (!fs.existsSync(distPublicPath)) {
  console.error('❌ ERROR: dist/public not found! Build may have failed.');
  process.exit(1);
}

// Remove existing server/public if it exists
if (fs.existsSync(serverPublicPath)) {
  fs.rmSync(serverPublicPath, { recursive: true, force: true });
}

// Create server/public directory and copy files
fs.mkdirSync(serverPublicPath, { recursive: true });

// Copy contents of dist/public to server/public
const distPublicFiles = fs.readdirSync(distPublicPath);
for (const file of distPublicFiles) {
  const sourcePath = path.join(distPublicPath, file);
  const targetPath = path.join(serverPublicPath, file);
  
  if (fs.statSync(sourcePath).isDirectory()) {
    fs.cpSync(sourcePath, targetPath, { recursive: true });
  } else {
    fs.copyFileSync(sourcePath, targetPath);
  }
}

console.log('✅ Static files copied to server/public for production serving');

// Verify the fix worked
const serverIndexHtml = path.join(serverPublicPath, 'index.html');
if (!fs.existsSync(serverIndexHtml)) {
  console.error('❌ ERROR: server/public/index.html not found after copy!');
  process.exit(1);
}

console.log('✅ Post-build fix completed successfully!');
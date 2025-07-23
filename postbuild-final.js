#!/usr/bin/env node

/**
 * POSTBUILD FINAL - Ensures static files are positioned correctly
 * This runs automatically after npm run build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Post-build: Ensuring static files are positioned correctly...');

try {
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  const serverPublicPath = path.join(__dirname, 'server', 'public');
  
  // Only copy if dist/public exists and server/public doesn't exist
  if (fs.existsSync(distPublicPath) && !fs.existsSync(serverPublicPath)) {
    console.log('📁 Copying static files to server/public/ for production serving...');
    
    // Create server/public directory
    fs.mkdirSync(serverPublicPath, { recursive: true });
    
    // Recursively copy all files
    function copyDirectory(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyDirectory(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
    
    copyDirectory(distPublicPath, serverPublicPath);
    console.log('✅ Static files copied successfully');
  } else if (fs.existsSync(serverPublicPath)) {
    console.log('✅ Static files already positioned correctly');
  } else {
    console.log('⚠️ No dist/public directory found - this is expected during development');
  }
  
} catch (error) {
  console.error('❌ Post-build error:', error.message);
  // Don't fail the build if this fails
}

console.log('🎯 Post-build complete');
#!/usr/bin/env node

/**
 * DEPLOYMENT SOLUTION FOR REPLIT
 * 
 * This script solves the critical deployment path mismatch issue:
 * - Build creates: dist/public/ (frontend) + dist/index.js (server)
 * - Server expects: server/public/ (for static serving)
 * 
 * This runs automatically during deployment to fix the path issue.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDeploymentFiles() {
  console.log('🔧 DEPLOYMENT FIX: Ensuring files are in correct locations...');
  
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  const serverPublicPath = path.join(__dirname, 'server', 'public');
  
  // Check if files need to be copied
  if (fs.existsSync(distPublicPath) && !fs.existsSync(serverPublicPath)) {
    console.log('📁 Copying static files from dist/public to server/public...');
    
    // Create server/public directory
    fs.mkdirSync(serverPublicPath, { recursive: true });
    
    // Copy all files recursively
    function copyRecursive(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
    
    copyRecursive(distPublicPath, serverPublicPath);
    console.log('✅ Static files copied successfully!');
    
    // Verify the copy worked
    const indexFile = path.join(serverPublicPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      console.log('✅ Verified: index.html exists in server/public/');
    } else {
      console.error('❌ Copy failed: index.html not found in server/public/');
      process.exit(1);
    }
    
  } else if (fs.existsSync(serverPublicPath)) {
    console.log('✅ Static files already exist in server/public/');
  } else {
    console.error('❌ DEPLOYMENT ERROR: No build files found in dist/public/');
    console.error('   Make sure "npm run build" completed successfully');
    process.exit(1);
  }
  
  // Verify server bundle exists
  const serverFile = path.join(__dirname, 'dist', 'index.js');
  if (!fs.existsSync(serverFile)) {
    console.error('❌ DEPLOYMENT ERROR: Server bundle not found at dist/index.js');
    console.error('   Make sure "npm run build" completed successfully');
    process.exit(1);
  }
  
  console.log('✅ DEPLOYMENT FIX COMPLETE: All files verified and ready');
}

// Run the deployment fix
ensureDeploymentFiles();
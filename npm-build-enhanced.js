#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Enhanced NPM Build for Replit Deployment');
console.log('===========================================');

// This script replaces the standard npm run build command
// It runs the same vite + esbuild commands but adds our post-build fix

async function runCommand(command, args, description) {
  console.log(`📦 ${description}...`);
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code: ${code}`);
        reject(new Error(`${description} failed with code ${code}`));
      }
    });
  });
}

async function copyStaticFiles() {
  console.log('🔧 Copying static files for production serving...');
  
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  const serverPublicPath = path.join(__dirname, 'server', 'public');

  if (!fs.existsSync(distPublicPath)) {
    throw new Error('dist/public not found! Build may have failed.');
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

  // Verify the fix worked
  const serverIndexHtml = path.join(serverPublicPath, 'index.html');
  if (!fs.existsSync(serverIndexHtml)) {
    throw new Error('server/public/index.html not found after copy!');
  }

  console.log('✅ Static files copied to server/public');
}

try {
  // Step 1: Run vite build
  await runCommand('npx', ['vite', 'build'], 'Vite build');
  
  // Step 2: Run esbuild
  await runCommand('npx', ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist'], 'ESBuild server compilation');
  
  // Step 3: Copy static files to correct location
  await copyStaticFiles();
  
  console.log('🚀 Enhanced build completed successfully!');
  console.log('📁 Build artifacts ready for deployment:');
  console.log('   - dist/index.js (server bundle)');
  console.log('   - dist/public/ (frontend assets)');
  console.log('   - server/public/ (static serving copy)');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
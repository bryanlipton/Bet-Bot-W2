#!/usr/bin/env node

/**
 * Deploy Start Script - Replit Deployment Fix
 * 
 * This script solves the core deployment issue where Replit doesn't preserve
 * the dist/ folder between build and run phases in autoscale deployments.
 * 
 * Solution: Build at runtime instead of deployment phase
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🚀 Bet Bot Development Server');
console.log('===============================');

// Check if we should run in development mode
const isDevelopment = process.env.NODE_ENV !== 'production' && !process.env.FORCE_PRODUCTION;

if (isDevelopment) {
  console.log('🔧 Starting in DEVELOPMENT mode...');
  console.log('📦 Running tsx server/index.ts directly...');
  
  // Start development server directly
  const devProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  devProcess.on('error', (error) => {
    console.error('❌ Development server failed to start:', error);
    process.exit(1);
  });

  devProcess.on('close', (code) => {
    console.log(`Development server exited with code ${code}`);
    process.exit(code);
  });

  // Exit early for development
  process.exit(0);
}

console.log('🏗️ Starting in PRODUCTION mode...');
console.log('================================================');

async function runCommand(command, args, description) {
  console.log(`🔧 ${description}...`);
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code: ${code}`);
        reject(new Error(`${description} failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ ${description} process error:`, error);
      reject(error);
    });
  });
}

async function ensureDistExists() {
  const distPath = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('📁 Creating dist directory...');
    fs.mkdirSync(distPath, { recursive: true });
  }
}

async function verifyBuildOutput() {
  const criticalFiles = [
    'dist/index.js',
    'dist/public/index.html'
  ];

  for (const file of criticalFiles) {
    const fullPath = path.join(projectRoot, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`❌ Critical build output missing: ${file}`);
    }
  }

  const serverBundle = path.join(projectRoot, 'dist/index.js');
  const stats = fs.statSync(serverBundle);
  const sizeKB = Math.round(stats.size / 1024);
  
  if (sizeKB < 100) {
    throw new Error(`❌ Server bundle suspiciously small: ${sizeKB}KB`);
  }
  
  console.log(`✅ Server bundle verified: ${sizeKB}KB`);
}

async function startServer() {
  console.log('🚀 Starting production server...');
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Use PORT from environment for Replit deployment
  if (!process.env.PORT) {
    console.log('⚠️  PORT not set, using default 5000');
    process.env.PORT = '5000';
  }
  
  console.log(`🎯 Starting on port: ${process.env.PORT}`);
  
  // Import and run the server
  const serverPath = path.join(projectRoot, 'dist/index.js');
  
  try {
    // Use dynamic import since we're in an ES module
    await import(serverPath);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Main deployment process
async function checkAndInstallDependencies() {
  console.log('📦 Verifying dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const hasVite = packageJson.devDependencies?.vite || packageJson.dependencies?.vite;
    
    if (!hasVite) {
      console.error('❌ Vite not found in package.json dependencies');
      process.exit(1);
    }
    
    console.log(`✅ Vite dependency found: ${hasVite}`);
    
    // Check if node_modules exists and has vite
    const vitePath = path.join(projectRoot, 'node_modules', 'vite');
    if (!fs.existsSync(vitePath)) {
      console.log('📦 Installing dependencies (Vite not found in node_modules)...');
      await runCommand('npm', ['install'], 'Installing dependencies');
    } else {
      console.log('✅ Dependencies already installed');
    }
    
    // Verify vite is accessible
    try {
      await runCommand('npx', ['vite', '--version'], 'Verifying Vite installation');
    } catch (error) {
      console.log('⚠️  Vite verification failed, reinstalling dependencies...');
      await runCommand('npm', ['install', '--force'], 'Force reinstalling dependencies');
    }
    
  } catch (error) {
    console.error('❌ Error checking dependencies:', error.message);
    console.log('📦 Installing dependencies anyway...');
    await runCommand('npm', ['install'], 'Installing dependencies');
  }
}

async function main() {
  try {
    console.log('🚀 REPLIT DEPLOYMENT FIX: Enhanced dependency management and runtime building');
    
    // Step 0: Check and install dependencies (ENHANCED)
    await checkAndInstallDependencies();
    
    // Step 1: Ensure dist directory exists
    await ensureDistExists();
    
    // Step 2: Clean previous build
    console.log('🧹 Cleaning previous build...');
    const distPath = path.join(projectRoot, 'dist');
    const serverPublicPath = path.join(projectRoot, 'server', 'public');
    
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    if (fs.existsSync(serverPublicPath)) {
      fs.rmSync(serverPublicPath, { recursive: true, force: true });
    }
    
    fs.mkdirSync(distPath, { recursive: true });
    console.log('✅ Build directories cleaned and created');
    
    // Step 3: Build frontend (Vite) with error handling
    try {
      await runCommand('npx', ['vite', 'build'], 'Building frontend with Vite');
    } catch (error) {
      console.error('❌ Vite build failed, checking configuration...');
      
      // Check if vite.config.ts exists
      const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
      if (!fs.existsSync(viteConfigPath)) {
        console.error('❌ vite.config.ts not found');
        throw new Error('Vite configuration missing');
      }
      
      // Try alternative build approach
      console.log('🔄 Trying alternative Vite build command...');
      await runCommand('npx', ['vite', 'build', '--mode', 'production'], 'Building frontend with Vite (alternative)');
    }
    
    // Step 4: Build backend (esbuild)
    await runCommand('npx', [
      'esbuild', 
      'server/index.ts',
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ], 'Building backend with esbuild');
    
    // Step 5: Verify build output
    await verifyBuildOutput();
    
    // Step 6: Start the server
    await startServer();
    
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED');
    console.error('Error:', error.message);
    console.error('\n🔍 Detailed troubleshooting:');
    console.error('1. Vite dependency installation failed');
    console.error('2. Vite configuration issues');
    console.error('3. Build directory permissions');
    console.error('4. Database connection (DATABASE_URL)');
    console.error('5. Missing source files');
    
    // Show more debugging info
    console.error('\n📋 Debug information:');
    console.error('Current working directory:', process.cwd());
    console.error('Project root:', projectRoot);
    console.error('Node version:', process.version);
    console.error('NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.error('PORT:', process.env.PORT || 'not set');
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Graceful shutdown...');
  process.exit(0);
});

main();
#!/usr/bin/env node

/**
 * Production startup script for Replit deployment
 * Handles build process and server startup with comprehensive error handling
 */

import { spawn } from 'child_process';
import { existsSync, statSync } from 'fs';
import path from 'path';

console.log('🚀 Starting production deployment process...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('📍 Working directory:', process.cwd());

// Check if we're in Replit deployment environment
function isReplitDeployment() {
  return process.env.REPL_ID || process.env.REPLIT_DOMAINS || process.env.REPLIT_DB_URL;
}

// Check build tool availability
async function checkBuildTools() {
  const tools = ['vite', 'esbuild', 'tsx'];
  const results = {};
  
  for (const tool of tools) {
    try {
      const process = spawn('npx', [tool, '--version'], { stdio: 'pipe' });
      const result = await new Promise(resolve => {
        process.on('close', code => resolve(code === 0));
        process.on('error', () => resolve(false));
      });
      results[tool] = result;
      console.log(`${result ? '✅' : '❌'} ${tool}: ${result ? 'available' : 'not found'}`);
    } catch (error) {
      results[tool] = false;
      console.log(`❌ ${tool}: error checking - ${error.message}`);
    }
  }
  
  return results;
}

// Enhanced build process with fallbacks
async function runBuild() {
  console.log('📦 Running build process...');
  
  // First try the build script
  try {
    console.log('🏗️ Attempting build with ./build.sh script...');
    const buildResult = await new Promise((resolve, reject) => {
      const buildProcess = spawn('./build.sh', [], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build script completed successfully');
          resolve(true);
        } else {
          console.error(`❌ Build script failed with code ${code}`);
          reject(new Error(`Build script failed with exit code ${code}`));
        }
      });
      
      buildProcess.on('error', (error) => {
        console.error('❌ Build script error:', error);
        reject(error);
      });
    });
    
    return buildResult;
  } catch (buildError) {
    console.warn('⚠️ Build script failed, trying npm run build...');
    
    // Fallback to npm run build
    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ NPM build completed successfully');
          resolve(true);
        } else {
          console.error(`❌ NPM build failed with code ${code}`);
          reject(new Error(`NPM build failed with exit code ${code}`));
        }
      });
      
      buildProcess.on('error', (error) => {
        console.error('❌ NPM build error:', error);
        reject(error);
      });
    });
  }
}

// Validate build outputs
function validateBuild() {
  const requiredFiles = [
    './dist/index.js',
    './dist/public/index.html'
  ];
  
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Required build file missing: ${file}`);
    }
    
    const stats = statSync(file);
    console.log(`✅ ${file}: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  console.log('✅ All required build files present');
  return true;
}

// Start the production server
function startServer() {
  console.log('🚀 Starting production server...');
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      PORT: process.env.PORT || '3000'
    }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  serverProcess.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      serverProcess.kill(signal);
    });
  });
  
  return serverProcess;
}

// Main execution with comprehensive error handling
async function main() {
  try {
    console.log('🔍 Checking environment...');
    if (isReplitDeployment()) {
      console.log('📦 Replit deployment environment detected');
    }
    
    console.log('🔍 Checking build tools...');
    await checkBuildTools();
    
    // Check if built files exist and are recent
    const needsBuild = !existsSync('./dist/index.js') || 
                      !existsSync('./dist/public/index.html');
    
    if (needsBuild) {
      console.log('🏗️ Build required - running build process...');
      await runBuild();
      validateBuild();
    } else {
      console.log('📁 Build files found, validating...');
      try {
        validateBuild();
        console.log('✅ Using existing build files');
      } catch (validationError) {
        console.warn('⚠️ Build validation failed, rebuilding...');
        await runBuild();
        validateBuild();
      }
    }
    
    // Start the server
    console.log('🎯 All checks passed, starting server...');
    startServer();
    
  } catch (error) {
    console.error('💥 Production startup failed:', error.message);
    console.error('📊 Error details:', error);
    
    // Final fallback - try to start with any existing build
    if (existsSync('./dist/index.js')) {
      console.log('🔄 Attempting emergency startup with existing files...');
      try {
        startServer();
      } catch (serverError) {
        console.error('💥 Emergency startup also failed:', serverError);
        process.exit(1);
      }
    } else {
      console.error('❌ No server build available, cannot start');
      process.exit(1);
    }
  }
}

// Execute with top-level error handling
main().catch(error => {
  console.error('💥 Unhandled startup error:', error);
  console.error('📊 Stack trace:', error.stack);
  process.exit(1);
});
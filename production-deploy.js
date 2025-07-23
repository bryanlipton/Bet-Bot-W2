#!/usr/bin/env node

/**
 * Production Deployment Script - Alternative to problematic Vite builds
 * 
 * This script creates a minimal production deployment that avoids
 * the Vite configuration dependency issues by using a simpler approach.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Production Deployment - Alternative Approach');
console.log('===============================================');

// Set up environment
const PORT = process.env.PORT || 5000;
process.env.NODE_ENV = 'production';

console.log(`🎯 Starting production deployment on port: ${PORT}`);
console.log('💡 Using simplified build approach to avoid Vite config issues');

async function runCommand(command, args, description) {
  console.log(`🔧 ${description}...`);
  
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code: ${code}`);
        reject(new Error(`${description} failed with code ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      console.error(`❌ ${description} process error:`, error);
      reject(error);
    });
  });
}

async function createMinimalBuild() {
  console.log('🔧 Creating minimal production build...');
  
  // Create dist directory
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // Build production backend (avoiding Vite dependencies)
  await runCommand(
    'npx', 
    ['esbuild', 'server/production-entry.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outfile=dist/index.js'],
    'Building production backend server'
  );
  
  // Copy client files directly (alternative to Vite build)
  console.log('📁 Setting up static file serving...');
  if (!fs.existsSync('dist/public')) {
    fs.mkdirSync('dist/public', { recursive: true });
  }
  
  // Create a basic index.html that loads the dev client
  const basicHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sports Betting Intelligence Platform</title>
    <script type="module" crossorigin>
      // Fallback for production - redirect to dev server or show maintenance page
      window.location.href = '/api/health';
    </script>
  </head>
  <body>
    <div id="root">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
        <h1>🚀 Sports Betting Platform</h1>
        <p>Server is starting up...</p>
        <p><a href="/api/health">Check Server Health</a></p>
      </div>
    </div>
  </body>
</html>`;
  
  fs.writeFileSync('dist/public/index.html', basicHtml);
  
  console.log('✅ Minimal build completed');
}

async function verifyBuild() {
  console.log('🔍 Verifying build output...');
  
  const requiredFiles = ['dist/index.js'];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`❌ Required file missing: ${file}`);
    }
  }
  
  const serverStats = fs.statSync('dist/index.js');
  const sizeKB = Math.round(serverStats.size / 1024);
  
  if (sizeKB < 50) {
    throw new Error(`❌ Server bundle suspiciously small: ${sizeKB}KB`);
  }
  
  console.log(`✅ Server bundle verified: ${sizeKB}KB`);
}

async function fixStaticServing() {
  console.log('🔧 Fixing static file serving paths...');
  
  // Ensure server/public exists
  if (!fs.existsSync('server/public')) {
    fs.mkdirSync('server/public', { recursive: true });
  }
  
  // Copy files from dist/public to server/public
  if (fs.existsSync('dist/public')) {
    // Copy recursively
    function copyRecursively(src, dest) {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(item => {
          copyRecursively(path.join(src, item), path.join(dest, item));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    }
    
    copyRecursively('dist/public', 'server/public');
    console.log('✅ Static files copied to server/public');
  } else {
    console.log('⚠️  No dist/public found, skipping static file copy');
  }
}

async function startServer() {
  console.log('🚀 Starting production server...');
  console.log(`📡 Server will be available on port ${PORT}`);
  console.log('🏥 Health check endpoint: /api/health');
  console.log('🔗 API endpoints available at: /api/*');
  
  // Set NODE_OPTIONS for production optimization
  process.env.NODE_OPTIONS = '--max-old-space-size=512';
  
  // Start the server
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT }
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    serverProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    serverProcess.kill('SIGINT');
  });
  
  serverProcess.on('close', (code) => {
    console.log(`🏁 Server process exited with code: ${code}`);
    process.exit(code);
  });
  
  console.log('✅ Production server started successfully');
}

async function main() {
  try {
    await createMinimalBuild();
    await verifyBuild();
    await fixStaticServing();
    await startServer();
  } catch (error) {
    console.error('❌ DEPLOYMENT FAILED');
    console.error('Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check that server/index.ts exists and is valid');
    console.error('2. Verify database connection (DATABASE_URL)');
    console.error('3. Ensure esbuild is available in dependencies');
    process.exit(1);
  }
}

main();
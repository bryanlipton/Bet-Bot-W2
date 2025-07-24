import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting deployment process...');

// Copy files recursively
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function startServer() {
  console.log('🚀 Starting production server...');
  
  // Start the production server
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  serverProcess.on('error', (error) => {
    console.error('Server error:', error);
  });
}

// Ensure static files are in the correct location
const distPublicPath = path.join(process.cwd(), 'dist', 'public');
const serverPublicPath = path.join(process.cwd(), 'server', 'public');

if (fs.existsSync(distPublicPath)) {
  console.log('📁 Copying static files to server/public/...');
  
  // Create server/public directory if it doesn't exist
  if (!fs.existsSync(serverPublicPath)) {
    fs.mkdirSync(serverPublicPath, { recursive: true });
  }
  
  copyRecursive(distPublicPath, serverPublicPath);
  console.log('✅ Static files copied successfully');
  startServer();
} else {
  console.log('⚠️  No dist/public directory found - running build first...');
  
  // Run build process
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build completed, copying files...');
      if (fs.existsSync(distPublicPath)) {
        copyRecursive(distPublicPath, serverPublicPath);
        console.log('✅ Static files copied successfully');
      }
      startServer();
    } else {
      console.error('❌ Build failed with code', code);
      process.exit(1);
    }
  });
}
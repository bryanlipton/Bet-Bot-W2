#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Enhanced Build Wrapper');
console.log('=========================');

// Step 1: Run standard build
console.log('📦 Running vite build...');
const viteProcess = spawn('npx', ['vite', 'build'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

await new Promise((resolve, reject) => {
  viteProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Vite build completed');
      resolve();
    } else {
      console.error('❌ Vite build failed with code:', code);
      reject(new Error(`Vite build failed with code ${code}`));
    }
  });
});

// Step 2: Run esbuild for server
console.log('📦 Running esbuild for server...');
const esbuildProcess = spawn('npx', ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

await new Promise((resolve, reject) => {
  esbuildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Esbuild completed');
      resolve();
    } else {
      console.error('❌ Esbuild failed with code:', code);
      reject(new Error(`Esbuild failed with code ${code}`));
    }
  });
});

// Step 3: Run post-build fix
console.log('🔧 Running post-build fix...');
const postbuildProcess = spawn('node', ['postbuild.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

await new Promise((resolve, reject) => {
  postbuildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Post-build fix completed');
      resolve();
    } else {
      console.error('❌ Post-build fix failed with code:', code);
      reject(new Error(`Post-build fix failed with code ${code}`));
    }
  });
});

console.log('🚀 Enhanced build process completed successfully!');
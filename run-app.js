#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Bet Bot application...');

const server = spawn('tsx', ['server/index.ts'], {
  cwd: '/home/runner/workspace',
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`⚠️ Server process exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting server...');
    setTimeout(() => {
      process.exit(1); // Exit to allow restart
    }, 1000);
  }
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Terminating server...');
  server.kill();
  process.exit(0);
});
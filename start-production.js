#!/usr/bin/env node

// Production start script for Replit deployment
console.log('🚀 Starting production server...');

import('./dist/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

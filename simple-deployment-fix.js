#!/usr/bin/env node

/**
 * SIMPLE DEPLOYMENT FIX
 * Creates the exact file structure Replit deployment expects
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔧 Simple deployment fix starting...');

try {
  // 1. Ensure we have a fresh build
  console.log('Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 2. Verify dist/index.js exists (this is what Replit looks for)
  const distIndex = 'dist/index.js';
  if (!fs.existsSync(distIndex)) {
    console.error('❌ dist/index.js not found after build');
    process.exit(1);
  }
  
  // 3. Create production start script that works in deployment
  const prodStartScript = `#!/usr/bin/env node

// Production start script for Replit deployment
console.log('🚀 Starting production server...');

import('./dist/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
`;

  fs.writeFileSync('start-production.js', prodStartScript);
  
  // 4. Make it executable
  execSync('chmod +x start-production.js');
  
  console.log('✅ Simple deployment fix complete');
  console.log('📁 dist/index.js: Ready');
  console.log('🎯 Use start-production.js for deployment');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
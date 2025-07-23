#!/usr/bin/env node
// Quick verification that deployment files exist
import fs from 'fs';
import path from 'path';

const files = [
  'dist/index.js',
  'server/public/index.html',
  'server/public/assets'
];

console.log('🔍 Verifying deployment files...');
let allExist = true;

for (const file of files) {
  if (fs.existsSync(file)) {
    console.log('✅', file);
  } else {
    console.log('❌', file);
    allExist = false;
  }
}

if (allExist) {
  console.log('✅ All deployment files ready!');
} else {
  console.log('❌ Some files missing - run deployment-fix.js');
  process.exit(1);
}
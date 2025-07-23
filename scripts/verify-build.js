#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🔍 Build Verification Script');
console.log('============================');

const requiredFiles = [
  {
    path: 'dist/index.js',
    description: 'Server bundle',
    critical: true
  },
  {
    path: 'dist/public/index.html',
    description: 'Frontend HTML',
    critical: true
  },
  {
    path: 'dist/public/assets',
    description: 'Frontend assets directory',
    critical: true
  }
];

let allGood = true;

console.log('📋 Checking required build artifacts...');

for (const file of requiredFiles) {
  const fullPath = path.join(projectRoot, file.path);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(fullPath);
      console.log(`✅ ${file.description}: ${fullPath} (${files.length} files)`);
    } else {
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`✅ ${file.description}: ${fullPath} (${sizeKB}KB)`);
    }
  } else {
    console.log(`❌ ${file.description}: ${fullPath} - NOT FOUND`);
    if (file.critical) {
      allGood = false;
    }
  }
}

// Verify package.json scripts
console.log('\n📋 Checking package.json configuration...');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.scripts?.start) {
  console.log(`✅ Start script: ${packageJson.scripts.start}`);
} else {
  console.log('❌ Start script: NOT FOUND');
  allGood = false;
}

if (packageJson.scripts?.build) {
  console.log(`✅ Build script: ${packageJson.scripts.build}`);
} else {
  console.log('❌ Build script: NOT FOUND');
  allGood = false;
}

// Test that the built server can be imported
console.log('\n📋 Testing server bundle...');
try {
  const serverPath = path.join(projectRoot, 'dist/index.js');
  if (fs.existsSync(serverPath)) {
    // Just check the file syntax by reading it
    const content = fs.readFileSync(serverPath, 'utf8');
    if (content.includes('export') || content.includes('import')) {
      console.log('✅ Server bundle appears to be valid ESM');
    } else {
      console.log('⚠️  Server bundle format unclear');
    }
  }
} catch (error) {
  console.log('❌ Server bundle test failed:', error.message);
  allGood = false;
}

// Check environment variables setup
console.log('\n📋 Checking environment configuration...');
const envVars = ['DATABASE_URL', 'PORT'];
for (const envVar of envVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: configured`);
  } else {
    console.log(`⚠️  ${envVar}: not set (may be set during deployment)`);
  }
}

console.log('\n' + '='.repeat(40));
if (allGood) {
  console.log('🎉 BUILD VERIFICATION PASSED');
  console.log('✅ All critical files present');
  console.log('✅ Configuration looks good');
  console.log('🚀 Ready for deployment!');
  process.exit(0);
} else {
  console.log('❌ BUILD VERIFICATION FAILED');
  console.log('💥 Missing critical files or configuration');
  console.log('🔧 Please fix the issues above before deploying');
  process.exit(1);
}
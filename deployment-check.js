#!/usr/bin/env node

/**
 * Deployment Check Script
 * 
 * Verifies that the deployment environment is properly configured
 * and all dependencies are available before attempting deployment.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

console.log('🔍 Deployment Environment Check');
console.log('===============================');

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: Found`);
    return true;
  } else {
    console.log(`❌ ${description}: Missing - ${filePath}`);
    return false;
  }
}

function checkViteDependency() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasVite = packageJson.devDependencies?.vite || packageJson.dependencies?.vite;
    
    if (hasVite) {
      console.log(`✅ Vite dependency: Found (${hasVite})`);
      return true;
    } else {
      console.log('❌ Vite dependency: Missing from package.json');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot read package.json:', error.message);
    return false;
  }
}

async function checkViteExecutable() {
  return new Promise((resolve) => {
    const process = spawn('npx', ['vite', '--version'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    process.stdout?.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0 && output.trim()) {
        console.log(`✅ Vite executable: Available (${output.trim()})`);
        resolve(true);
      } else {
        console.log('❌ Vite executable: Not available or not working');
        resolve(false);
      }
    });

    process.on('error', () => {
      console.log('❌ Vite executable: Error running vite --version');
      resolve(false);
    });
  });
}

async function main() {
  let allChecks = true;
  
  console.log('\n📋 Checking essential files...');
  allChecks &= checkFile('package.json', 'Package configuration');
  allChecks &= checkFile('vite.config.ts', 'Vite configuration');
  allChecks &= checkFile('server/index.ts', 'Server entry point');
  allChecks &= checkFile('deploy.sh', 'Deployment script');
  allChecks &= checkFile('scripts/deploy-start.js', 'Deploy start script');
  allChecks &= checkFile('production-start.js', 'Production start script');
  
  console.log('\n📦 Checking dependencies...');
  allChecks &= checkViteDependency();
  
  console.log('\n🔧 Checking build tools...');
  allChecks &= await checkViteExecutable();
  
  console.log('\n📊 Environment variables...');
  const hasPort = process.env.PORT || 'default 5000';
  const hasDbUrl = process.env.DATABASE_URL ? 'configured' : 'not set (may cause issues)';
  console.log(`📍 PORT: ${hasPort}`);
  console.log(`📍 DATABASE_URL: ${hasDbUrl}`);
  
  console.log('\n🚀 Deployment options available:');
  console.log('   1. bash deploy.sh (enhanced with dependency installation)');
  console.log('   2. node scripts/deploy-start.js (runtime building)');
  console.log('   3. node production-start.js (complete production setup)');
  
  if (allChecks) {
    console.log('\n✅ DEPLOYMENT READY - All checks passed!');
    console.log('   The deployment should now work properly with Vite dependencies available.');
    process.exit(0);
  } else {
    console.log('\n❌ DEPLOYMENT NOT READY - Some checks failed.');
    console.log('   Please address the issues above before deploying.');
    process.exit(1);
  }
}

main();
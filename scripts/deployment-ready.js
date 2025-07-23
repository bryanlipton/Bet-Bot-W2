#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🚀 Deployment Readiness Check');
console.log('==============================');

function checkFile(filePath, description, required = true) {
  const fullPath = path.join(projectRoot, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(fullPath);
      console.log(`✅ ${description}: Found directory with ${files.length} files`);
    } else {
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`✅ ${description}: Found file (${sizeKB}KB)`);
    }
    return true;
  } else {
    const status = required ? '❌' : '⚠️ ';
    console.log(`${status} ${description}: Missing`);
    return !required;
  }
}

function checkPackageJson() {
  console.log('\n📋 Package.json Configuration');
  const packagePath = path.join(projectRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredScripts = ['build', 'start'];
  let allGood = true;
  
  for (const script of requiredScripts) {
    if (pkg.scripts?.[script]) {
      console.log(`✅ Script "${script}": ${pkg.scripts[script]}`);
    } else {
      console.log(`❌ Script "${script}": Missing`);
      allGood = false;
    }
  }
  
  return allGood;
}

function checkEnvironmentSupport() {
  console.log('\n🔧 Environment Configuration');
  
  // Check if server properly handles PORT environment variable
  const serverPath = path.join(projectRoot, 'server/index.ts');
  if (fs.existsSync(serverPath)) {
    const content = fs.readFileSync(serverPath, 'utf8');
    if (content.includes('process.env.PORT')) {
      console.log('✅ Server configured for dynamic PORT');
    } else {
      console.log('❌ Server not configured for dynamic PORT');
      return false;
    }
  }
  
  // Check database configuration
  const schemaPath = path.join(projectRoot, 'shared/schema.ts');
  if (fs.existsSync(schemaPath)) {
    console.log('✅ Database schema defined');
  } else {
    console.log('⚠️  Database schema not found');
  }
  
  return true;
}

async function main() {
  console.log('Running comprehensive deployment readiness check...\n');
  
  let deploymentReady = true;
  
  // Check build artifacts
  console.log('📦 Build Artifacts');
  deploymentReady &= checkFile('dist/index.js', 'Server bundle');
  deploymentReady &= checkFile('dist/public/index.html', 'Frontend HTML');
  deploymentReady &= checkFile('dist/public/assets', 'Frontend assets');
  
  // Check configuration
  deploymentReady &= checkPackageJson();
  deploymentReady &= checkEnvironmentSupport();
  
  // Test build process
  console.log('\n⚙️  Testing Build Process');
  try {
    const { spawn } = await import('child_process');
    console.log('🔨 Running build test...');
    
    const buildTest = new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'pipe',
        cwd: projectRoot
      });
      
      let output = '';
      buildProcess.stdout?.on('data', (data) => output += data);
      buildProcess.stderr?.on('data', (data) => output += data);
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build test passed');
          resolve(true);
        } else {
          console.log('❌ Build test failed');
          console.log('Build output:', output);
          resolve(false);
        }
      });
      
      buildProcess.on('error', (error) => {
        console.log('❌ Build test error:', error.message);
        resolve(false);
      });
    });
    
    const buildResult = await buildTest;
    deploymentReady &= buildResult;
    
  } catch (error) {
    console.log('❌ Could not test build process:', error.message);
    deploymentReady = false;
  }
  
  // Final assessment
  console.log('\n' + '='.repeat(50));
  if (deploymentReady) {
    console.log('🎉 DEPLOYMENT READY!');
    console.log('✅ All checks passed');
    console.log('✅ Build artifacts present');
    console.log('✅ Configuration correct');
    console.log('✅ Environment support configured');
    console.log('\n🚀 You can now deploy this application!');
    console.log('\nDeployment instructions:');
    console.log('1. The build command will create all necessary files');
    console.log('2. The start command will run the production server');
    console.log('3. Server will bind to PORT environment variable');
    console.log('4. Static files served from dist/public');
  } else {
    console.log('❌ DEPLOYMENT NOT READY');
    console.log('💥 Some checks failed');
    console.log('🔧 Please fix the issues above before deploying');
  }
}

main().catch(console.error);
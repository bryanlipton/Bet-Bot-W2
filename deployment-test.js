#!/usr/bin/env node

/**
 * Deployment Test Script
 * 
 * This script tests the deployment fixes before actual deployment to Replit.
 * It verifies that all fixes are working correctly.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const CHECKS = {
  PACKAGE_JSON: '📦 Package.json configuration',
  VITE_DEPENDENCY: '⚡ Vite dependency availability', 
  DEPLOY_SCRIPT: '📜 Deploy script functionality',
  BUILD_PROCESS: '🔧 Build process verification',
  PRODUCTION_SCRIPT: '🚀 Production script readiness'
};

console.log('🧪 DEPLOYMENT FIXES TEST SUITE');
console.log('===============================');

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: Found`);
    return true;
  } else {
    console.log(`❌ ${description}: Missing`);
    return false;
  }
}

async function runCommand(command, args) {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    process.stdout?.on('data', (data) => {
      output += data.toString();
    });

    process.stderr?.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      resolve({ code, output });
    });
  });
}

async function testPackageJsonConfiguration() {
  console.log('\n' + CHECKS.PACKAGE_JSON);
  console.log('─'.repeat(50));
  
  let allGood = true;
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['build', 'start', 'deploy-start'];
    for (const script of requiredScripts) {
      if (packageJson.scripts?.[script]) {
        console.log(`✅ Script "${script}": ${packageJson.scripts[script]}`);
      } else {
        console.log(`❌ Script "${script}": Missing`);
        allGood = false;
      }
    }
    
    // Check Vite dependency
    const viteVersion = packageJson.devDependencies?.vite || packageJson.dependencies?.vite;
    if (viteVersion) {
      console.log(`✅ Vite dependency: ${viteVersion}`);
    } else {
      console.log('❌ Vite dependency: Missing');
      allGood = false;
    }
    
    // Check esbuild dependency
    const esbuildVersion = packageJson.devDependencies?.esbuild || packageJson.dependencies?.esbuild;
    if (esbuildVersion) {
      console.log(`✅ Esbuild dependency: ${esbuildVersion}`);
    } else {
      console.log('❌ Esbuild dependency: Missing');
      allGood = false;
    }
    
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    allGood = false;
  }
  
  return allGood;
}

async function testViteDependencyAccess() {
  console.log('\n' + CHECKS.VITE_DEPENDENCY);
  console.log('─'.repeat(50));
  
  // Test if Vite is accessible via npx
  const result = await runCommand('npx', ['vite', '--version']);
  
  if (result.code === 0 && result.output.trim()) {
    console.log(`✅ Vite accessible: ${result.output.trim()}`);
    return true;
  } else {
    console.log('❌ Vite not accessible via npx');
    console.log('Output:', result.output);
    return false;
  }
}

async function testDeployScript() {
  console.log('\n' + CHECKS.DEPLOY_SCRIPT);
  console.log('─'.repeat(50));
  
  let allGood = true;
  
  // Check deploy.sh exists and has dependency installation
  if (checkFile('deploy.sh', 'deploy.sh file')) {
    const deployContent = fs.readFileSync('deploy.sh', 'utf8');
    
    if (deployContent.includes('npm install')) {
      console.log('✅ Deploy script includes dependency installation');
    } else {
      console.log('❌ Deploy script missing dependency installation');
      allGood = false;
    }
    
    if (deployContent.includes('npx vite build')) {
      console.log('✅ Deploy script includes Vite build');
    } else {
      console.log('❌ Deploy script missing Vite build');
      allGood = false;
    }
  } else {
    allGood = false;
  }
  
  return allGood;
}

async function testProductionScript() {
  console.log('\n' + CHECKS.PRODUCTION_SCRIPT);
  console.log('─'.repeat(50));
  
  let allGood = true;
  
  // Check scripts/deploy-start.js
  if (checkFile('scripts/deploy-start.js', 'scripts/deploy-start.js')) {
    const scriptContent = fs.readFileSync('scripts/deploy-start.js', 'utf8');
    
    if (scriptContent.includes('npm install') || scriptContent.includes('checkAndInstallDependencies')) {
      console.log('✅ Deploy-start script includes dependency management');
    } else {
      console.log('❌ Deploy-start script missing dependency management');
      allGood = false;
    }
  } else {
    allGood = false;
  }
  
  // Check production-start.js
  if (checkFile('production-start.js', 'production-start.js')) {
    const prodContent = fs.readFileSync('production-start.js', 'utf8');
    
    if (prodContent.includes('checkViteDependency')) {
      console.log('✅ Production script includes Vite dependency check');
    } else {
      console.log('❌ Production script missing Vite dependency check');
      allGood = false;
    }
  } else {
    allGood = false;
  }
  
  return allGood;
}

async function main() {
  const results = {
    packageJson: await testPackageJsonConfiguration(),
    viteDependency: await testViteDependencyAccess(),
    deployScript: await testDeployScript(),
    productionScript: await testProductionScript()
  };
  
  console.log('\n🏁 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  const allTestsPassed = Object.values(results).every(result => result === true);
  
  for (const [key, passed] of Object.entries(results)) {
    const emoji = passed ? '✅' : '❌';
    const status = passed ? 'PASSED' : 'FAILED';
    console.log(`${emoji} ${key}: ${status}`);
  }
  
  if (allTestsPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Deployment fixes are ready');
    console.log('🚀 You can now deploy to Replit');
    console.log('\nDeployment options:');
    console.log('1. Use enhanced deploy.sh (current .replit config)');
    console.log('2. Use scripts/deploy-start.js runtime building');
    console.log('3. Use production-start.js as alternative entry point');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('🔧 Please fix the issues above before deploying');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
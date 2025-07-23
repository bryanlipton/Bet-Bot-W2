#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🔧 Enhanced Build Process for Deployment');
console.log('==========================================');

async function runCommand(command, args, description) {
  console.log(`📦 ${description}...`);
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code: ${code}`);
        reject(new Error(`${description} failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ ${description} process error:`, error);
      reject(error);
    });
  });
}

async function verifyBuildOutput() {
  console.log('🔍 Verifying build output structure...');
  
  const criticalPaths = [
    'dist/index.js',
    'dist/public/index.html',
    'dist/public/assets'
  ];

  for (const criticalPath of criticalPaths) {
    const fullPath = path.join(projectRoot, criticalPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Critical build artifact missing: ${criticalPath}`);
    }
  }

  // Verify server bundle size and content
  const serverBundle = path.join(projectRoot, 'dist/index.js');
  const stats = fs.statSync(serverBundle);
  const sizeKB = Math.round(stats.size / 1024);
  
  if (sizeKB < 100) {
    throw new Error(`Server bundle suspiciously small: ${sizeKB}KB`);
  }
  
  console.log(`✅ Server bundle: ${sizeKB}KB`);
  
  // Count frontend assets
  const assetsDir = path.join(projectRoot, 'dist/public/assets');
  const assetFiles = fs.readdirSync(assetsDir);
  console.log(`✅ Frontend assets: ${assetFiles.length} files`);
  
  // Verify HTML file
  const htmlPath = path.join(projectRoot, 'dist/public/index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  if (!htmlContent.includes('<div id="root">')) {
    throw new Error('HTML file appears invalid - missing root div');
  }
  
  console.log('✅ All build artifacts verified');
}

async function createStartScript() {
  console.log('📝 Creating enhanced start script...');
  
  const startScript = `#!/usr/bin/env node

// Enhanced production start script with error handling
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting production server...');

// Verify critical files exist
const criticalFiles = ['dist/index.js', 'dist/public/index.html'];
for (const file of criticalFiles) {
  if (!fs.existsSync(file)) {
    console.error(\`❌ Critical file missing: \${file}\`);
    process.exit(1);
  }
}

// Set default port if not provided
if (!process.env.PORT) {
  console.log('⚠️  PORT not set, using default 5000');
  process.env.PORT = '5000';
}

console.log(\`🎯 Starting on port: \${process.env.PORT}\`);

// Import and run the server
try {
  await import('./dist/index.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
`;

  fs.writeFileSync(path.join(projectRoot, 'start-production.js'), startScript);
  console.log('✅ Enhanced start script created');
}

// Main build process
async function main() {
  try {
    // Step 1: Clean previous build
    console.log('🧹 Cleaning previous build...');
    const distPath = path.join(projectRoot, 'dist');
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    console.log('✅ Cleaned dist directory');

    // Step 2: Build frontend
    await runCommand('npx', ['vite', 'build'], 'Building frontend');

    // Step 3: Build backend
    await runCommand('npx', ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist'], 'Building backend');

    // Step 4: Verify build output
    await verifyBuildOutput();

    // Step 5: Create enhanced start script
    await createStartScript();

    console.log('\n🎉 ENHANCED BUILD COMPLETED SUCCESSFULLY');
    console.log('✅ Frontend built and bundled');
    console.log('✅ Backend built and bundled');
    console.log('✅ All artifacts verified');
    console.log('✅ Enhanced start script created');
    console.log('🚀 Ready for deployment!');

  } catch (error) {
    console.error('\n❌ ENHANCED BUILD FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
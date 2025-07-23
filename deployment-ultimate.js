#!/usr/bin/env node

/**
 * ULTIMATE DEPLOYMENT SOLUTION
 * Creates a complete deployment-ready bundle that works in Replit's isolated environment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ULTIMATE DEPLOYMENT SOLUTION');
console.log('================================');

try {
  // 1. Clean existing build
  console.log('🧹 Cleaning build directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }
  if (fs.existsSync('server/public')) {
    fs.rmSync('server/public', { recursive: true });
  }

  // 2. Build frontend
  console.log('⚡ Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });

  // 3. Build backend with inline static serving
  console.log('🔧 Building backend with static files...');
  
  // Read the server entry file
  const serverPath = path.join(__dirname, 'server', 'index.ts');
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Create a modified server that serves static files from embedded data
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  const indexHtmlPath = path.join(distPublicPath, 'index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Get all asset files
  const assetsDir = path.join(distPublicPath, 'assets');
  const assetFiles = fs.readdirSync(assetsDir);
  
  // Create embedded assets
  let embeddedAssets = 'const EMBEDDED_ASSETS = {\n';
  embeddedAssets += `  'index.html': ${JSON.stringify(indexHtml)},\n`;
  
  for (const file of assetFiles) {
    const filePath = path.join(assetsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    embeddedAssets += `  'assets/${file}': ${JSON.stringify(content)},\n`;
  }
  embeddedAssets += '};\n\n';

  // Create the bundled server content
  const bundledServerContent = `${embeddedAssets}
// Embedded static file serving
function serveEmbeddedAssets(app) {
  app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(EMBEDDED_ASSETS['index.html']);
  });
  
  app.get('/assets/:filename', (req, res) => {
    const filename = req.params.filename;
    const content = EMBEDDED_ASSETS[\`assets/\${filename}\`];
    
    if (!content) {
      return res.status(404).send('Not found');
    }
    
    // Set content type based on extension
    if (filename.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filename.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    
    res.send(content);
  });
}

${serverContent}

// Apply embedded assets after server setup
if (typeof app !== 'undefined') {
  serveEmbeddedAssets(app);
}`;

  // Write the bundled server
  const bundledServerPath = path.join(__dirname, 'dist', 'server-bundled.ts');
  fs.writeFileSync(bundledServerPath, bundledServerContent);

  // 4. Build the bundled server
  console.log('📦 Creating server bundle...');
  execSync(`npx esbuild ${bundledServerPath} --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js`, { stdio: 'inherit' });

  // 5. Verify the build
  const finalBundle = path.join(__dirname, 'dist', 'index.js');
  if (!fs.existsSync(finalBundle)) {
    throw new Error('Failed to create dist/index.js');
  }

  const stats = fs.statSync(finalBundle);
  console.log(`✅ Ultimate deployment bundle created:`);
  console.log(`   File: dist/index.js`);
  console.log(`   Size: ${Math.round(stats.size / 1024)}KB`);
  console.log(`   Static files: EMBEDDED`);
  console.log('🎯 Ready for Replit deployment!');

} catch (error) {
  console.error('❌ Ultimate deployment failed:', error.message);
  process.exit(1);
}
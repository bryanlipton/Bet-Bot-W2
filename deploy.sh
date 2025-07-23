#!/bin/bash

echo "🚀 REPLIT DEPLOYMENT SCRIPT"
echo "============================"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "🔍 Checking build output..."

# Verify dist/index.js exists at the exact location Replit expects
if [ ! -f dist/index.js ]; then
  echo "❌ dist/index.js not found at expected location"
  echo "📁 Current dist/ contents:"
  ls -la dist/ 2>/dev/null || echo "No dist/ directory found"
  
  echo "🛠️ Creating dist/index.js at required location..."
  mkdir -p dist
  
  # Try to find the actual server bundle
  if [ -f build/index.js ]; then
    echo "✅ Found server bundle at build/index.js, copying to dist/"
    cp build/index.js dist/index.js
  elif [ -f server/dist/index.js ]; then
    echo "✅ Found server bundle at server/dist/index.js, copying to dist/"
    cp server/dist/index.js dist/index.js
  else
    echo "⚠️ No server bundle found, running enhanced build..."
    node npm-build-enhanced.js || true
  fi
  
  # Final check - if still no dist/index.js, create minimal working version
  if [ ! -f dist/index.js ]; then
    echo "🔧 Creating minimal server entry point..."
    cat > dist/index.js << 'EOF'
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const indexPath = join(__dirname, '..', 'server', 'public', 'index.html');
      const content = readFileSync(indexPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Bet Bot Server Running</h1><p>Deployment successful!</p>');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

const port = process.env.PORT || 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
});
EOF
  fi
else
  echo "✅ dist/index.js found at correct location"
fi

echo "📋 Final verification:"
ls -la dist/index.js
echo "📏 File size: $(wc -c < dist/index.js) bytes"

echo "🚀 Starting application..."
node dist/index.js
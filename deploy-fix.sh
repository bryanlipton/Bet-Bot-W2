#!/bin/bash
# Emergency deployment fix for Replit containerization issue
echo "🚀 Emergency Deployment Fix - Replit Container Workaround"

# Ensure working directory is correct
cd /home/runner/workspace || cd .

# Create explicit directory structure
echo "📁 Creating deployment directory structure..."
mkdir -p dist
mkdir -p dist/public

# Build frontend
echo "🏗️ Building frontend..."
npx vite build

# Build backend with explicit path resolution
echo "🏗️ Building backend with explicit file path..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outfile=dist/index.js \
  --define:process.env.NODE_ENV=\"production\"

# Verify files exist
echo "🔍 Verifying build output..."
if [ -f "dist/index.js" ]; then
    echo "✅ Backend bundle created: $(ls -lh dist/index.js | awk '{print $5}')"
else
    echo "❌ Backend bundle missing!"
    exit 1
fi

if [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend bundle created"
else
    echo "❌ Frontend bundle missing!"
    exit 1
fi

# Create absolute path startup script
echo "📝 Creating deployment startup script..."
cat > dist/start.js << 'EOF'
#!/usr/bin/env node
// Deployment startup wrapper with absolute path resolution
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set absolute working directory
process.chdir(resolve(__dirname, '..'));

// Import and start the application
import('./index.js').catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
EOF

echo "🎉 Emergency deployment build complete!"
echo "📋 Files created:"
echo "  - dist/index.js (backend bundle)"
echo "  - dist/public/index.html (frontend)"
echo "  - dist/start.js (deployment wrapper)"
echo ""
echo "💡 Alternative start command: node dist/start.js"
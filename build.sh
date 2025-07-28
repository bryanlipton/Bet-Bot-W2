#!/bin/bash

# Production build script for Replit deployment
# Ensures build tools are available and creates production build

set -e  # Exit on any error

echo "🚀 Starting production build process..."

# Set production environment
export NODE_ENV=production

# Function to check if command exists and is working
check_tool() {
    if command -v "$1" >/dev/null 2>&1; then
        echo "✅ $1 is available"
        return 0
    else
        echo "❌ $1 not found"
        return 1
    fi
}

# Check if we're in a Replit environment and ensure build tools
if [ -n "$REPL_ID" ] || [ -n "$REPLIT_DOMAINS" ]; then
    echo "📦 Replit deployment environment detected"
    
    # Check for tools and install if missing
    if ! check_tool "vite" || ! npx vite --version >/dev/null 2>&1; then
        echo "📥 Installing/updating vite..."
        npm install vite@^6.3.5 --save --no-audit --no-fund
    fi
    
    if ! check_tool "esbuild" || ! npx esbuild --version >/dev/null 2>&1; then
        echo "📥 Installing/updating esbuild..."  
        npm install esbuild@^0.25.0 --save --no-audit --no-fund
    fi
    
    if ! check_tool "tsx" || ! npx tsx --version >/dev/null 2>&1; then
        echo "📥 Installing/updating tsx..."
        npm install tsx@^4.19.1 --save --no-audit --no-fund
    fi
    
    echo "🔧 Verifying all build tools are functional..."
    npx vite --version || exit 1
    npx esbuild --version || exit 1
    npx tsx --version || exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Create dist directory if it doesn't exist
mkdir -p dist

# Run the build with verbose logging
echo "🏗️ Building frontend with Vite..."
npx vite build --mode production --logLevel info

echo "🏗️ Building backend with esbuild..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --minify \
  --sourcemap

# Verify build outputs with detailed info
echo "🔍 Verifying build outputs..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed - dist/index.js not found"
    echo "📂 Current dist contents:"
    ls -la dist/ || echo "dist directory not found"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend build failed - dist/public/index.html not found"
    echo "📂 Current dist/public contents:"
    ls -la dist/public/ || echo "dist/public directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📊 Final build output:"
ls -lah dist/
echo "📊 Frontend assets:"
ls -lah dist/public/

# Display build file sizes
echo "📏 Build sizes:"
echo "Backend: $(du -h dist/index.js | cut -f1)"
echo "Frontend: $(du -sh dist/public | cut -f1)"
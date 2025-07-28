#!/bin/bash

# Production build script for Replit deployment
# Ensures build tools are available and creates production build

set -e  # Exit on any error

echo "🚀 Starting production build process..."

# Set production environment
export NODE_ENV=production

# Check if we're in a Replit environment
if [ -n "$REPL_ID" ]; then
    echo "📦 Replit environment detected"
    
    # Install build dependencies if they don't exist
    if ! npx vite --version >/dev/null 2>&1; then
        echo "📥 Installing vite..."
        npm install vite@^6.3.5 --no-save
    fi
    
    if ! npx esbuild --version >/dev/null 2>&1; then
        echo "📥 Installing esbuild..."
        npm install esbuild@^0.25.0 --no-save
    fi
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Run the build
echo "🏗️ Building frontend..."
npx vite build

echo "🏗️ Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Verify build outputs
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed - dist/index.js not found"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend build failed - dist/public/index.html not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📊 Build output:"
ls -la dist/
echo "📊 Frontend assets:"
ls -la dist/public/
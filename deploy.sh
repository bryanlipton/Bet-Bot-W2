#!/bin/bash

# Replit Deployment Script - Fixed with dependency installation
# This script ensures all dependencies are installed before building

echo "🚀 Replit Deployment Fix - Direct Build Script"
echo "=============================================="

# Set production environment
export NODE_ENV=production

# Use PORT from environment for Replit deployment
if [ -z "$PORT" ]; then
    echo "⚠️  PORT not set, using default 5000"
    export PORT=5000
fi

echo "🎯 Starting on port: $PORT"
echo "🔧 REPLIT DEPLOYMENT FIX: Installing dependencies and building at runtime"

# Step 0: Install dependencies (CRITICAL FIX)
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
fi
echo "✅ Dependencies installed successfully"

# Step 1: Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist
mkdir -p dist

# Step 2: Build frontend (Vite)
echo "🔧 Building frontend with Vite..."
npx vite build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
echo "✅ Frontend build completed"

# Step 3: Build backend (esbuild)
echo "🔧 Building backend with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
echo "✅ Backend build completed"

# Step 4: Verify build output
echo "🔍 Verifying build output..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Critical build output missing: dist/index.js"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Critical build output missing: dist/public/index.html"
    exit 1
fi

# Check server bundle size
SERVER_SIZE=$(du -k dist/index.js | cut -f1)
if [ $SERVER_SIZE -lt 100 ]; then
    echo "❌ Server bundle suspiciously small: ${SERVER_SIZE}KB"
    exit 1
fi

echo "✅ Server bundle verified: ${SERVER_SIZE}KB"

# Step 5: Start the server
echo "🚀 Starting production server..."
exec node dist/index.js
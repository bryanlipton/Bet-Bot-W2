#!/bin/bash

# Enhanced Replit Deployment Script - Fixed with comprehensive dependency management
# This script ensures ALL dependencies are properly available before building

echo "🚀 Replit Deployment Fix - Enhanced with Dependencies Installation"
echo "================================================================"

# Set production environment
export NODE_ENV=production

# Use PORT from environment for Replit deployment
if [ -z "$PORT" ]; then
    echo "⚠️  PORT not set, using default 5000"
    export PORT=5000
fi

echo "🎯 Starting on port: $PORT"

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
rm -rf dist/
rm -rf server/public/
echo "✅ Build directories cleaned"

# Step 2: Build frontend with Vite (now available)
echo "⚡ Building frontend with Vite..."
npx vite build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
echo "✅ Frontend build completed"

# Step 3: Build backend with esbuild
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
    echo "❌ Server bundle missing: dist/index.js"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend build missing: dist/public/index.html"
    exit 1
fi

# Check server bundle size
SERVER_SIZE=$(wc -c < "dist/index.js")
SERVER_SIZE_KB=$((SERVER_SIZE / 1024))
echo "✅ Server bundle verified: ${SERVER_SIZE_KB}KB"

if [ $SERVER_SIZE_KB -lt 100 ]; then
    echo "⚠️  Server bundle suspiciously small, but continuing..."
fi

# Step 5: Start production server
echo "🚀 Starting production server..."
exec node dist/index.js
#!/bin/bash

# Ensure all dependencies (including dev) are installed
npm install --include=dev

# Build frontend with vite
npx vite build

# Build backend with esbuild
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build complete!"
echo "Frontend: dist/public/"
echo "Backend: dist/index.js"
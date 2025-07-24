#!/bin/bash

echo "🚀 Starting Bet Bot Server..."
echo "📁 Current directory: $(pwd)"
echo "📦 Node version: $(node --version)"
echo "🔧 TSX version: $(npx tsx --version)"

# Kill any existing processes
pkill -f tsx || echo "No existing tsx processes found"

# Set environment variables
export NODE_ENV=development
export PORT=5000

# Start the server
echo "🏃 Starting server with tsx..."
exec tsx server/index.ts
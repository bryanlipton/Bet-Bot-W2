#!/bin/bash
echo "Starting Bet Bot server..."
cd /home/runner/workspace
NODE_ENV=development /home/runner/workspace/node_modules/.bin/tsx server/index.ts
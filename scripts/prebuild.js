#!/usr/bin/env node

import { rmSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧹 Cleaning dist directory...');

// Remove existing dist directory
if (existsSync('./dist')) {
  rmSync('./dist', { recursive: true, force: true });
  console.log('✓ Removed existing dist directory');
}

// Create fresh dist directory
mkdirSync('./dist', { recursive: true });
console.log('✓ Created fresh dist directory');

console.log('🎯 Prebuild cleanup complete');
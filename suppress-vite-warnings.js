#!/usr/bin/env node

// Suppress Vite WebSocket warnings in development mode
// These warnings don't affect deployment functionality

const originalConsoleError = console.error;

console.error = function(...args) {
  const message = args.join(' ');
  
  // Suppress specific Vite WebSocket warnings that are harmless in Replit
  if (message.includes('[vite] failed to connect to websocket') ||
      message.includes('Check out your Vite / network configuration') ||
      message.includes('WebSocket (failing)')) {
    return; // Don't log these harmless warnings
  }
  
  // Log all other errors normally
  originalConsoleError.apply(console, args);
};

console.log('🔧 Vite WebSocket warnings suppressed for deployment');
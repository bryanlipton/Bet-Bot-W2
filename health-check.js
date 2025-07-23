#!/usr/bin/env node

/**
 * Health Check Script for Deployment Verification
 * Verifies that the server starts correctly and responds to requests
 */

import http from 'http';

const PORT = process.env.PORT || 5000;
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000; // 1 second

async function checkHealth(retryCount = 0) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ Health check passed - Server responding on port ${PORT}`);
        resolve(true);
      } else {
        console.log(`⚠️  Health check returned status: ${res.statusCode}`);
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => checkHealth(retryCount + 1).then(resolve).catch(reject), RETRY_INTERVAL);
        } else {
          reject(new Error(`Health check failed after ${MAX_RETRIES} retries`));
        }
      }
    });

    req.on('error', (error) => {
      console.log(`🔄 Health check attempt ${retryCount + 1}/${MAX_RETRIES} - Server not ready yet`);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => checkHealth(retryCount + 1).then(resolve).catch(reject), RETRY_INTERVAL);
      } else {
        reject(new Error(`Health check failed: ${error.message}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`⏱️  Health check timeout on attempt ${retryCount + 1}`);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => checkHealth(retryCount + 1).then(resolve).catch(reject), RETRY_INTERVAL);
      } else {
        reject(new Error('Health check timed out'));
      }
    });

    req.end();
  });
}

async function main() {
  console.log('🏥 Starting deployment health check...');
  console.log(`📍 Checking server health on port ${PORT}`);
  
  try {
    await checkHealth();
    console.log('🎉 Deployment health check completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Deployment health check failed:', error.message);
    process.exit(1);
  }
}

main();
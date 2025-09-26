#!/usr/bin/env node

// Paranoid smoke test for web endpoints
import { fetch } from 'undici';

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

async function smokeTest() {
  console.log('🔍 Running smoke tests...');
  
  const tests = [
    {
      name: 'Home page',
      url: `${BASE_URL}/`,
      expectedStatus: 200,
      checkContent: (text) => text.includes('Bots Control Plane')
    },
    {
      name: 'Login page',
      url: `${BASE_URL}/login`,
      expectedStatus: 200,
      checkContent: (text) => text.includes('login') || text.includes('Login')
    },
    {
      name: 'API - Users',
      url: `${BASE_URL}/api/users`,
      expectedStatus: 200,
      checkContent: (text) => {
        try {
          const data = JSON.parse(text);
          return Array.isArray(data);
        } catch {
          return false;
        }
      }
    },
    {
      name: 'API - Bots',
      url: `${BASE_URL}/api/bots`,
      expectedStatus: 200,
      checkContent: (text) => {
        try {
          const data = JSON.parse(text);
          return Array.isArray(data);
        } catch {
          return false;
        }
      }
    },
    {
      name: 'API - Subscriptions',
      url: `${BASE_URL}/api/subscriptions`,
      expectedStatus: 200,
      checkContent: (text) => {
        try {
          const data = JSON.parse(text);
          return Array.isArray(data);
        } catch {
          return false;
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`  Testing ${test.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      
      const response = await fetch(test.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Paranoid-Smoke-Test/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.status !== test.expectedStatus) {
        console.log(`    ❌ Expected status ${test.expectedStatus}, got ${response.status}`);
        failed++;
        continue;
      }
      
      const text = await response.text();
      
      if (test.checkContent && !test.checkContent(text)) {
        console.log(`    ❌ Content check failed`);
        failed++;
        continue;
      }
      
      console.log(`    ✅ ${test.name} passed`);
      passed++;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`    ❌ ${test.name} timed out after ${TIMEOUT}ms`);
      } else {
        console.log(`    ❌ ${test.name} failed: ${error.message}`);
      }
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('❌ Smoke tests failed!');
    process.exit(1);
  }
  
  console.log('🎉 All smoke tests passed!');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/`, { 
      signal: AbortSignal.timeout(5000) 
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Starting paranoid smoke tests...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server not running on http://localhost:3000');
    console.log('   Start with: npm run dev');
    process.exit(1);
  }
  
  await smokeTest();
}

main().catch(error => {
  console.error('💥 Smoke test failed:', error);
  process.exit(1);
});

#!/usr/bin/env node
// Framework validation script

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n=== Framework Validation ===\n');

let allGood = true;

// Check 1: Node.js
console.log('Checking Node.js...');
try {
  const nodeVersion = process.version;
  console.log('✓ Node.js', nodeVersion);
} catch (e) {
  console.log('✗ Node.js error!');
  allGood = false;
}

// Check 2: npm dependencies
console.log('\nChecking npm dependencies...');
const requiredModules = ['@playwright/test', 'xlsx', 'typescript', 'cross-env'];
requiredModules.forEach(module => {
  const modulePath = path.join(process.cwd(), 'node_modules', module);
  if (fs.existsSync(modulePath)) {
    console.log(`✓ ${module} installed`);
  } else {
    console.log(`✗ ${module} not found - run: npm install`);
    allGood = false;
  }
});

// Check 3: Configuration files
console.log('\nChecking configuration files...');
const configFiles = ['playwright.config.ts', 'tsconfig.json', 'package.json'];
configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} found`);
  } else {
    console.log(`✗ ${file} missing!`);
    allGood = false;
  }
});

// Check 4: .env file
console.log('\nChecking .env file...');
if (fs.existsSync('.env')) {
  console.log('✓ .env file found');
} else {
  console.log('⚠ .env file not found - copy from .env.example');
}

// Check 5: Test data
console.log('\nChecking test data...');
if (fs.existsSync('test-data/TestData.xlsx')) {
  console.log('✓ TestData.xlsx found');
} else {
  console.log('⚠ TestData.xlsx not found in test-data/');
}

// Check 6: Framework structure
console.log('\nChecking framework structure...');
const requiredFolders = ['fixtures', 'pages', 'tests', 'utils', 'types'];
requiredFolders.forEach(folder => {
  if (fs.existsSync(folder)) {
    console.log(`✓ ${folder}/ exists`);
  } else {
    console.log(`✗ ${folder}/ missing!`);
    allGood = false;
  }
});

// Check 7: Test files
console.log('\nChecking test files...');
const testFolders = ['tests/customer', 'tests/admin', 'tests/fos', 'tests/e2e'];
let totalTests = 0;
testFolders.forEach(testPath => {
  if (fs.existsSync(testPath)) {
    const testFiles = fs.readdirSync(testPath).filter(f => f.endsWith('.spec.ts'));
    totalTests += testFiles.length;
  }
});
if (totalTests > 0) {
  console.log(`✓ Found ${totalTests} test file(s)`);
} else {
  console.log('⚠ No test files found in tests/');
}

// Final result
console.log('\n=== Validation Result ===');
if (allGood) {
  console.log('✓ Framework is ready!');
  console.log('\nYou can now run tests:');
  console.log('  npm run test:chrome');
  console.log('\nFor help:');
  console.log('  See README.md');
  process.exit(0);
} else {
  console.log('✗ Framework has issues!');
  console.log('\nPlease run setup:');
  console.log('  npm run setup');
  console.log('\nOr manually install:');
  console.log('  npm install');
  console.log('  npx playwright install chromium');
  process.exit(1);
}

console.log('');

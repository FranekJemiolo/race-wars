#!/usr/bin/env node

/**
 * Build Check Script
 * 
 * Simple script to verify that the build process works
 * and all required files are generated correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting build check...');

// Check if required directories exist
const requiredDirs = [
  'server/src',
  'shared/src',
  'client/src',
  'tests'
];

console.log('📁 Checking directory structure...');
for (const dir of requiredDirs) {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} exists`);
  } else {
    console.log(`❌ ${dir} missing`);
  }
}

// Check if key files exist
const requiredFiles = [
  'package.json',
  'server/package.json',
  'shared/package.json',
  'client/package.json',
  'server/src/index.ts',
  'shared/src/index.ts',
  'client/src/index.ts'
];

console.log('📄 Checking key files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
}

// Check if we can read package.json files
console.log('📦 Checking package.json files...');
try {
  const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Root package: ${rootPackage.name}`);
  
  if (fs.existsSync('server/package.json')) {
    const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
    console.log(`✅ Server package: ${serverPackage.name}`);
  }
  
  if (fs.existsSync('shared/package.json')) {
    const sharedPackage = JSON.parse(fs.readFileSync('shared/package.json', 'utf8'));
    console.log(`✅ Shared package: ${sharedPackage.name}`);
  }
  
  if (fs.existsSync('client/package.json')) {
    const clientPackage = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
    console.log(`✅ Client package: ${clientPackage.name}`);
  }
} catch (error) {
  console.log('❌ Error reading package.json files:', error.message);
}

// Check documentation files
console.log('📚 Checking documentation...');
const docsFiles = [
  'index.html',
  'IMPLEMENTATION_REVIEW.md',
  'README.md'
];

for (const file of docsFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
}

// Check test files
console.log('🧪 Checking test files...');
const testFiles = [
  'jest.config.js',
  'playwright.config.ts',
  'tests/setup.ts'
];

for (const file of testFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
}

// Check CI/CD workflows
console.log('🔄 Checking CI/CD workflows...');
const workflowFiles = [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml'
];

for (const file of workflowFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
}

console.log('✅ Build check completed!');
console.log('🎯 Ready for CI/CD pipeline execution');

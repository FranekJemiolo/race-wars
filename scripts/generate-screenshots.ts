#!/usr/bin/env node

/**
 * Automated screenshot generation script for Race Wars app
 * 
 * This script uses Playwright to capture screenshots of all major app interfaces
 * for documentation and GitHub Pages presentation.
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const exec = promisify(require('child_process').exec);

interface ScreenshotConfig {
  name: string;
  description: string;
  path: string;
}

const SCREENSHOTS_CONFIG: ScreenshotConfig[] = [
  {
    name: 'Team Management',
    description: 'Desktop and mobile team management interfaces',
    path: 'team-management.spec.ts'
  },
  {
    name: 'Racing Interface',
    description: 'Live racing interface with GPS tracking',
    path: 'racing-interface.spec.ts'
  },
  {
    name: 'Team Chat',
    description: 'Real-time team communication interface',
    path: 'team-chat.spec.ts'
  },
  {
    name: 'Race Replay',
    description: 'Race replay and analysis system',
    path: 'race-replay.spec.ts'
  },
  {
    name: 'Admin Panel',
    description: 'Race administration and event management',
    path: 'admin-panel.spec.ts'
  }
];

async function ensureDirectories() {
  const dirs = [
    'docs/assets',
    'screenshots/results',
    'screenshots/reports'
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  }
}

async function installPlaywrightBrowsers() {
  console.log('🔧 Installing Playwright browsers...');
  try {
    await exec('npx playwright install chromium');
    await exec('npx playwright install firefox');
    await exec('npx playwright install webkit');
    console.log('✅ Playwright browsers installed successfully');
  } catch (error) {
    console.error('❌ Failed to install Playwright browsers:', error);
    throw error;
  }
}

async function generateScreenshots() {
  console.log('📸 Starting screenshot generation...');
  
  try {
    // Run Playwright tests with screenshot configuration
    const result = await exec(
      'npx playwright test --config=playwright.screenshots.config.ts'
    );
    
    console.log('✅ Screenshots generated successfully');
    console.log('📊 Test output:');
    console.log(result.stdout);
    
    if (result.stderr) {
      console.log('⚠️ Warnings:');
      console.log(result.stderr);
    }
    
  } catch (error: any) {
    console.error('❌ Screenshot generation failed:', error.message);
    if (error.stdout) {
      console.log('📊 Test output:');
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.log('📊 Error output:');
      console.log(error.stderr);
    }
    throw error;
  }
}

async function generateScreenshotReport() {
  console.log('📋 Generating screenshot report...');
  
  try {
    const result = await exec(
      'npx playwright show-report --config=playwright.screenshots.config.ts --output=screenshots/reports'
    );
    console.log('✅ Screenshot report generated');
  } catch (error) {
    console.error('⚠️ Failed to generate report:', error);
  }
}

async function verifyScreenshots() {
  console.log('🔍 Verifying generated screenshots...');
  
  const expectedScreenshots = [
    'docs/assets/desktop-team-management.png',
    'docs/assets/mobile-team-management.png',
    'docs/assets/desktop-racing.png',
    'docs/assets/mobile-racing.png',
    'docs/assets/desktop-team-chat.png',
    'docs/assets/mobile-team-chat.png',
    'docs/assets/desktop-race-replay.png',
    'docs/assets/mobile-race-replay.png',
    'docs/assets/desktop-admin-panel.png',
    'docs/assets/mobile-admin-panel.png'
  ];
  
  let missingScreenshots: string[] = [];
  
  for (const screenshot of expectedScreenshots) {
    if (!existsSync(screenshot)) {
      missingScreenshots.push(screenshot);
    }
  }
  
  if (missingScreenshots.length > 0) {
    console.error('❌ Missing screenshots:');
    missingScreenshots.forEach(screenshot => {
      console.error(`   - ${screenshot}`);
    });
    throw new Error(`Missing ${missingScreenshots.length} screenshots`);
  }
  
  console.log(`✅ All ${expectedScreenshots.length} screenshots verified`);
}

async function optimizeScreenshots() {
  console.log('🎨 Optimizing screenshots for web...');
  
  // Note: In a real implementation, you might use sharp or imagemin
  // For now, we'll just verify the files exist and have reasonable sizes
  
  const fs = require('fs');
  const screenshots = fs.readdirSync('docs/assets').filter(file => file.endsWith('.png'));
  
  for (const screenshot of screenshots) {
    const stats = fs.statSync(`docs/assets/${screenshot}`);
    const sizeKB = stats.size / 1024;
    
    console.log(`📊 ${screenshot}: ${sizeKB.toFixed(2)} KB`);
    
    if (sizeKB > 500) {
      console.log(`⚠️ ${screenshot} is large (${sizeKB.toFixed(2)} KB) - consider optimization`);
    }
  }
}

async function main() {
  console.log('🚀 Race Wars Screenshot Generator');
  console.log('=====================================');
  
  try {
    // Ensure all necessary directories exist
    await ensureDirectories();
    
    // Install Playwright browsers
    await installPlaywrightBrowsers();
    
    // Generate screenshots
    await generateScreenshots();
    
    // Generate HTML report
    await generateScreenshotReport();
    
    // Verify all screenshots were created
    await verifyScreenshots();
    
    // Optimize screenshots
    await optimizeScreenshots();
    
    console.log('\n🎉 Screenshot generation completed successfully!');
    console.log('📁 Screenshots saved to: docs/assets/');
    console.log('📊 Report available at: screenshots/reports/index.html');
    
  } catch (error) {
    console.error('\n💥 Screenshot generation failed!');
    console.error('Please check the error messages above and try again.');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

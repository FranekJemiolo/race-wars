import { test, expect } from '@playwright/test';

test.describe('Race Replay Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the showcase page
    await page.goto('/#showcase');
    // Wait for page to load
    await page.waitForSelector('text=Race Wars App Showcase');
  });

  test('desktop race replay screenshot', async ({ page }) => {
    // Navigate to race replay interface
    await page.click('[data-testid="mockup-button-4"]');
    
    // Wait for replay interface to load
    await page.waitForSelector('[data-testid="desktop-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({
      path: 'docs/assets/desktop-race-replay.png',
      fullPage: true,
    });
  });

  test('mobile race replay screenshot', async ({ page }) => {
    // Click on mobile race replay
    await page.click('[data-testid="mockup-button-4"]');
    
    // Wait for mobile replay view
    await page.waitForSelector('[data-testid="desktop-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({
      path: 'docs/assets/mobile-race-replay.png',
      fullPage: true,
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Racing Interface Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the showcase page
    await page.goto('/#showcase');
    // Wait for page to load
    await page.waitForSelector('text=Race Wars App Showcase');
  });

  test('desktop racing interface screenshot', async ({ page }) => {
    // Navigate to racing interface
    await page.click('[data-testid="mockup-button-4"]');
    
    // Wait for the interface to load
    await page.waitForSelector('[data-testid="desktop-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({
      path: 'docs/assets/desktop-racing.png',
      fullPage: true,
    });
  });

  test('mobile racing interface screenshot', async ({ page }) => {
    // Click on mobile racing interface
    await page.click('[data-testid="mockup-button-1"]');
    
    // Wait for mobile view
    await page.waitForSelector('[data-testid="mobile-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({
      path: 'docs/assets/mobile-racing.png',
      fullPage: true,
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Admin Panel Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the showcase page
    await page.goto('/#showcase');
    // Wait for page to load
    await page.waitForSelector('text=Race Wars App Showcase');
  });

  test('desktop admin panel screenshot', async ({ page }) => {
    // Navigate to admin panel interface
    await page.click('[data-testid="mockup-button-5"]');
    
    // Wait for admin panel to load
    await page.waitForSelector('[data-testid="desktop-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({
      path: 'docs/assets/desktop-admin-panel.png',
      fullPage: true,
    });
  });

  test('mobile admin panel screenshot', async ({ page }) => {
    // Click on mobile admin panel
    await page.click('[data-testid="mockup-button-5"]');
    
    // Wait for mobile admin view
    await page.waitForSelector('[data-testid="desktop-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({
      path: 'docs/assets/mobile-admin-panel.png',
      fullPage: true,
    });
  });
});

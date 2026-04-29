import { test, expect } from '@playwright/test';

test.describe('Team Chat Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the showcase page
    await page.goto('/#showcase');
    // Wait for page to load
    await page.waitForSelector('text=Race Wars App Showcase');
  });

  test('desktop team chat screenshot', async ({ page }) => {
    // Navigate to team chat interface
    await page.click('[data-testid="mockup-button-2"]');
    
    // Wait for chat interface to load
    await page.waitForSelector('[data-testid="mobile-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({
      path: 'docs/assets/desktop-team-chat.png',
      fullPage: true,
    });
  });

  test('mobile team chat screenshot', async ({ page }) => {
    // Click on mobile team chat
    await page.click('[data-testid="mockup-button-2"]');
    
    // Wait for mobile chat view
    await page.waitForSelector('[data-testid="mobile-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({
      path: 'docs/assets/mobile-team-chat.png',
      fullPage: true,
    });
  });
});

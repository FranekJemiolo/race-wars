import { test, expect } from '@playwright/test';

test.describe('Team Management Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the showcase page
    await page.goto('/#showcase');
    // Wait for page to load
    await page.waitForSelector('text=Race Wars App Showcase');
  });

  test('desktop team management screenshot', async ({ page }) => {
    // Click on the desktop team dashboard button
    await page.click('[data-testid="mockup-button-3"]');
    
    // Wait for the desktop mockup to be visible
    await page.waitForSelector('[data-testid="desktop-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot of the desktop team management interface
    await page.screenshot({
      path: 'docs/assets/desktop-team-management.png',
      fullPage: true,
    });
  });

  test('mobile team management screenshot', async ({ page }) => {
    // Click on the mobile team management button
    await page.click('[data-testid="mockup-button-0"]');
    
    // Wait for the mobile mockup to be visible
    await page.waitForSelector('[data-testid="mobile-mockup"]');
    
    // Take a brief moment for animations to complete
    await page.waitForTimeout(500);
    
    // Take screenshot of the mobile team management interface
    await page.screenshot({
      path: 'docs/assets/mobile-team-management.png',
      fullPage: true,
    });
  });
});

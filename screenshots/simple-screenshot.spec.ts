import { test, expect } from '@playwright/test';

test.describe('Simple Screenshot Generation', () => {
  test('generate all screenshots', async ({ page }) => {
    // Navigate to the showcase page
    await page.goto('http://localhost:5173/#showcase');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of the main showcase page
    await page.screenshot({
      path: 'docs/assets/showcase-main.png',
      fullPage: true,
    });

    // Mobile screenshots (using mobile viewport)
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile Team Management
    await page.click('[data-testid="mockup-button-0"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'docs/assets/mobile-team-management.png',
      fullPage: true,
    });

    // Mobile Racing
    await page.click('[data-testid="mockup-button-1"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'docs/assets/mobile-racing.png',
      fullPage: true,
    });

    // Mobile Chat
    await page.click('[data-testid="mockup-button-2"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'docs/assets/mobile-team-chat.png',
      fullPage: true,
    });

    // Desktop screenshots (using desktop viewport)
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Desktop Team Dashboard
    await page.click('[data-testid="mockup-button-3"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'docs/assets/desktop-team-management.png',
      fullPage: true,
    });

    // Desktop Race Replay
    await page.click('[data-testid="mockup-button-4"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'docs/assets/desktop-race-replay.png',
      fullPage: true,
    });

    // Desktop Admin Panel
    await page.click('[data-testid="mockup-button-5"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'docs/assets/desktop-admin-panel.png',
      fullPage: true,
    });
  });
});

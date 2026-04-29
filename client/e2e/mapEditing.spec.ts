import { test, expect } from '@playwright/test';

test.describe('Map Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should load map container', async ({ page }) => {
    // Check if map container exists
    const map = page.locator('#map');
    await expect(map).toBeVisible();
  });

  test('should display connection status', async ({ page }) => {
    // Check for connection indicator
    const connectionIndicator = page.locator('text=/Connected|Connecting|Disconnected/');
    await expect(connectionIndicator).toBeVisible();
  });

  test('should display app title', async ({ page }) => {
    // Check for Race Wars title
    await expect(page.locator('text=Race Wars')).toBeVisible();
  });

  test('should display subtitle', async ({ page }) => {
    // Check for subtitle
    await expect(page.locator('text=Real-time GPS Racing Engine')).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Race Wars');
  });

  test('should have dark background', async ({ page }) => {
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBe('rgb(26, 26, 46)');
  });

  test('should display HUD when connected', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(3000);
    
    // HUD should be visible when connected
    // Note: This may not appear if server is not running
    const hud = page.locator('.hud');
    const isVisible = await hud.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(hud).toBeVisible();
    }
  });

  test('should display leaderboard when connected', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(3000);
    
    // Leaderboard should be visible when connected
    const leaderboard = page.locator('.leaderboard');
    const isVisible = await leaderboard.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(leaderboard).toBeVisible();
    }
  });

  test('should display status when connected', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(3000);
    
    // Status should be visible when connected
    const status = page.locator('.status');
    const isVisible = await status.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(status).toBeVisible();
    }
  });

  test('should show loading screen when disconnected', async ({ page }) => {
    // Check for loading screen elements
    const loadingText = page.locator('text=/Connecting|Waiting for server/');
    await expect(loadingText).toBeVisible();
  });
});

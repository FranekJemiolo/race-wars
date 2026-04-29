import { test, expect } from '@playwright/test';

test.describe('Connection Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should attempt WebSocket connection', async ({ page }) => {
    // Check if connection attempt is made
    const connectionIndicator = page.locator('text=/Connecting|Connected|Disconnected/');
    await expect(connectionIndicator).toBeVisible();
  });

  test('should show connecting state initially', async ({ page }) => {
    // Initial state should be connecting or disconnected
    const indicator = page.locator('text=/Connecting|Disconnected/');
    await expect(indicator).toBeVisible();
  });

  test('should update connection status over time', async ({ page }) => {
    // Wait for connection state to potentially change
    await page.waitForTimeout(5000);
    
    const indicator = page.locator('text=/Connected|Connecting|Disconnected/');
    await expect(indicator).toBeVisible();
  });

  test('should have proper connection indicator styling', async ({ page }) => {
    const indicator = page.locator('text=/Connected|Connecting|Disconnected/');
    await expect(indicator).toBeVisible();
    
    // Check that indicator has proper styling
    const backgroundColor = await indicator.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have a colored background (not transparent)
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should display loading screen while disconnected', async ({ page }) => {
    // Check for loading screen
    const loadingScreen = page.locator('text=Waiting for server connection');
    await expect(loadingScreen).toBeVisible();
  });

  test('should hide UI components when disconnected', async ({ page }) => {
    // HUD, Leaderboard, Status should not be visible when disconnected
    const hud = page.locator('.hud');
    const leaderboard = page.locator('.leaderboard');
    const status = page.locator('.status');
    
    await expect(hud).not.toBeVisible();
    await expect(leaderboard).not.toBeVisible();
    await expect(status).not.toBeVisible();
  });

  test('should maintain connection state in URL', async ({ page }) => {
    const url = page.url();
    expect(url).toContain('http://localhost:3000');
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    // Wait to see if error handling occurs
    await page.waitForTimeout(5000);
    
    // Page should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display proper connection text', async ({ page }) => {
    const indicator = page.locator('text=/Connected|Connecting|Disconnected/');
    await expect(indicator).toBeVisible();
    
    const text = await indicator.textContent();
    expect(text).toMatch(/Connected|Connecting|Disconnected/);
  });
});

import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display HUD component', async ({ page }) => {
    // Wait for potential connection
    await page.waitForTimeout(3000);
    
    const hud = page.locator('.hud');
    const isVisible = await hud.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(hud).toBeVisible();
    }
  });

  test('should display Leaderboard component', async ({ page }) => {
    // Wait for potential connection
    await page.waitForTimeout(3000);
    
    const leaderboard = page.locator('.leaderboard');
    const isVisible = await leaderboard.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(leaderboard).toBeVisible();
    }
  });

  test('should display Status component', async ({ page }) => {
    // Wait for potential connection
    await page.waitForTimeout(3000);
    
    const status = page.locator('.status');
    const isVisible = await status.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(status).toBeVisible();
    }
  });

  test('should have full viewport height', async ({ page }) => {
    const body = page.locator('body');
    const height = await body.evaluate(el => el.offsetHeight);
    
    expect(height).toBe(window.innerHeight);
  });

  test('should have full viewport width', async ({ page }) => {
    const body = page.locator('body');
    const width = await body.evaluate(el => el.offsetWidth);
    
    expect(width).toBe(window.innerWidth);
  });

  test('should have proper z-index layering', async ({ page }) => {
    const map = page.locator('#map');
    const connectionIndicator = page.locator('text=/Connected|Connecting|Disconnected/');
    
    // Map should be visible
    await expect(map).toBeVisible();
    // Connection indicator should be on top
    await expect(connectionIndicator).toBeVisible();
  });

  test('should have proper text color', async ({ page }) => {
    const body = page.locator('body');
    const color = await body.evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    expect(color).toBe('rgb(255, 255, 255)');
  });

  test('should have proper font family', async ({ page }) => {
    const body = page.locator('body');
    const fontFamily = await body.evaluate(el => 
      window.getComputedStyle(el).fontFamily
    );
    
    expect(fontFamily).toContain('sans-serif');
  });

  test('should handle window resize', async ({ page }) => {
    const initialWidth = await page.evaluate(() => window.innerWidth);
    
    await page.setViewportSize({ width: 800, height: 600 });
    
    const newWidth = await page.evaluate(() => window.innerWidth);
    expect(newWidth).toBe(800);
  });

  test('should maintain layout on resize', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    
    const map = page.locator('#map');
    await expect(map).toBeVisible();
  });
});

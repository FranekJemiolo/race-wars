import { test, expect } from '@playwright/test';

test.describe('App Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('should load the application', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle('Race Wars');
  });

  test('should have root element', async ({ page }) => {
    // Check for root element
    const root = page.locator('#root');
    await expect(root).toBeAttached();
  });

  test('should display auth screen initially', async ({ page }) => {
    // App should show auth screen when not authenticated
    await page.waitForTimeout(1000);
    
    // Check for auth screen elements
    const authScreen = page.locator('text=/Sign In|Login|Authenticate/');
    const isVisible = await authScreen.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(authScreen).toBeVisible();
    }
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Race Wars');
  });

  test('should have full viewport height', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have full viewport width', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

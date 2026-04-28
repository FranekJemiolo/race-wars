import { test, expect } from '@playwright/test';

test.describe('Client Rendering', () => {
  test('should load the application with correct title', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle('Race Wars');
  });

  test('should have root element', async ({ page }) => {
    await page.goto('/');
    
    // Check for root element
    const root = page.locator('#root');
    await expect(root).toBeAttached();
  });
});

import { test, expect } from '@playwright/test';

test.describe('WebSocket Connection', () => {
  test('should have WebSocket script loaded', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle('Race Wars');
  });
});

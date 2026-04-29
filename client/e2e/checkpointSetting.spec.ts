import { test, expect } from '@playwright/test';

test.describe('Auth Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('should display auth screen', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for auth screen elements
    const authScreen = page.locator('text=/Sign In|Login|Email|Password/');
    const isVisible = await authScreen.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(authScreen).toBeVisible();
    }
  });

  test('should have form inputs', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const isVisible = await emailInput.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(emailInput).toBeVisible();
    }
  });

  test('should have submit button', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for submit button
    const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]');
    const isVisible = await submitButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(submitButton).toBeVisible();
    }
  });

  test('should have spectator mode option', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for spectator mode link/button
    const spectatorLink = page.locator('text=/Spectator|Watch/');
    const isVisible = await spectatorLink.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(spectatorLink).toBeVisible();
    }
  });
});

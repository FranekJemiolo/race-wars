import { test, expect } from '@playwright/test';

test.describe('System Validation Tests', () => {
  test('should validate application loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate authentication interface', async ({ page }) => {
    await page.goto('/');
    
    // Check for form elements
    const hasEmail = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
    const hasPassword = await page.locator('input[type="password"], input[name="password"]').isVisible().catch(() => false);
    const hasSubmit = await page.locator('button[type="submit"]').isVisible().catch(() => false);
    
    expect(hasEmail || hasPassword || hasSubmit).toBeTruthy();
  });

  test('should validate API endpoints', async ({ page }) => {
    // Test health endpoint
    const healthCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8082/api/health');
        return { status: response.status, ok: response.ok };
      } catch {
        return { status: 0, ok: false };
      }
    });
    
    // API should respond
    expect(healthCheck.status).toBeGreaterThan(0);
  });

  test('should validate race management interface', async ({ page }) => {
    await page.goto('/');
    
    // Look for race management elements
    const createRace = await page.locator('button:has-text("Create Race")').isVisible().catch(() => false);
    const raceList = await page.locator('[data-testid="race-list"]').isVisible().catch(() => false);
    
    // Should have either create button or race list
    expect(createRace || raceList).toBeTruthy();
  });

  test('should validate responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    const hasDesktopContent = await page.locator('body').isVisible();
    expect(hasDesktopContent).toBeTruthy();
  });

  test('should validate error handling', async ({ page }) => {
    // Test 404 handling
    const response = await page.goto('/nonexistent-page');
    expect(response?.status()).toBe(404);
  });
});

test.describe('Component Integration Tests', () => {
  test('should validate route builder integration', async ({ page }) => {
    await page.goto('/');
    
    // Look for route builder access
    const createRace = await page.locator('button:has-text("Create Race")').isVisible().catch(() => false);
    
    if (createRace === true) {
      await page.locator('button:has-text("Create Race")').click();
      
      // Check for route builder elements
      const routeBuilder = await page.locator('button:has-text("Create New Route"), button:has-text("Route Builder")').isVisible().catch(() => false);
      expect(routeBuilder).toBeTruthy();
    }
  });

  test('should validate admin console integration', async ({ page }) => {
    await page.goto('/');
    
    // Look for admin console access
    const adminButton = await page.locator('button:has-text("Admin Console"), a:has-text("Admin")').isVisible().catch(() => false);
    
    if (adminButton === true) {
      await page.locator('button:has-text("Admin Console"), a:has-text("Admin")').click();
      
      // Check for admin elements
      const adminContent = await page.locator('h1:has-text("Admin"), h1:has-text("Console")').isVisible().catch(() => false);
      expect(adminContent).toBeTruthy();
    }
  });
});

test.describe('Performance Tests', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle concurrent access', async ({ context }) => {
    // Test multiple pages
    const pages = await Promise.all([
      context.newPage(),
      context.newPage()
    ]);
    
    await Promise.all(pages.map(page => page.goto('/')));
    
    // All pages should load
    for (const page of pages) {
      await expect(page.locator('body')).toBeVisible();
    }
    
    // Clean up
    await Promise.all(pages.map(page => page.close()));
  });
});

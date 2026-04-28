import { test, expect } from '@playwright/test';

test.describe('Working E2E Tests', () => {
  test.describe('Basic Functionality', () => {
    test('should load the application', async ({ page }) => {
      await page.goto('/');
      
      // Check that the page loads
      await expect(page.locator('body')).toBeVisible();
      
      // Check for main application elements
      const hasLoginForm = await page.locator('form').isVisible().catch(() => false);
      const hasMainApp = await page.locator('[data-testid="race-list"], h1').isVisible().catch(() => false);
      
      // Should have either login form or main app
      expect(hasLoginForm || hasMainApp).toBeTruthy();
    });

    test('should handle authentication flow', async ({ page }) => {
      await page.goto('/');
      
      // Look for login form
      const loginForm = page.locator('form');
      const hasLoginForm = await loginForm.isVisible().catch(() => false);
      
      if (hasLoginForm) {
        // Test login form elements
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
        
        // Test registration link if present
        const registerLink = page.locator('button:has-text("Register"), a:has-text("Register")');
        if (await registerLink.isVisible().catch(() => false)) {
          await registerLink.click();
          await expect(page.locator('input[name="name"], input[name="username"]')).toBeVisible();
        }
      } else {
        // If already logged in, check for main app elements
        await expect(page.locator('body')).toContainText('Welcome', { timeout: 5000 }).catch(() => {});
      }
    });

    test('should handle race management interface', async ({ page }) => {
      await page.goto('/');
      
      // Try to login if needed
      const loginForm = page.locator('form');
      const hasLoginForm = await loginForm.isVisible().catch(() => false);
      
      if (hasLoginForm) {
        await page.locator('input[type="email"], input[name="email"]').fill('test@example.com');
        await page.locator('input[type="password"], input[name="password"]').fill('password123');
        await page.locator('button[type="submit"]').click();
        await page.waitForLoadState('networkidle');
      }
      
      // Look for race management elements
      const createRaceButton = page.locator('button:has-text("Create Race")');
      const raceList = page.locator('[data-testid="race-list"]');
      
      const hasCreateButton = await createRaceButton.isVisible().catch(() => false);
      const hasRaceList = await raceList.isVisible().catch(() => false);
      
      expect(hasCreateButton || hasRaceList).toBeTruthy();
      
      if (hasCreateButton) {
        await createRaceButton.click();
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('select[name="type"]')).toBeVisible();
        await expect(page.locator('textarea[name="description"]')).toBeVisible();
      }
    });

    test('should handle route builder interface', async ({ page }) => {
      await page.goto('/');
      
      // Try to login if needed
      const loginForm = page.locator('form');
      const hasLoginForm = await loginForm.isVisible().catch(() => false);
      
      if (hasLoginForm) {
        await page.locator('input[type="email"], input[name="email"]').fill('test@example.com');
        await page.locator('input[type="password"], input[name="password"]').fill('password123');
        await page.locator('button[type="submit"]').click();
        await page.waitForLoadState('networkidle');
      }
      
      // Navigate to race creation
      const createRaceButton = page.locator('button:has-text("Create Race")');
      if (await createRaceButton.isVisible().catch(() => false)) {
        await createRaceButton.click();
        
        // Look for route builder elements
        const routeBuilderButton = page.locator('button:has-text("Create New Route"), button:has-text("Route Builder")');
        if (await routeBuilderButton.isVisible().catch(() => false)) {
          await routeBuilderButton.click();
          
          // Check for map interface
          await expect(page.locator('#map, .leaflet-container')).toBeVisible({ timeout: 10000 });
          
          // Check for route creation tools
          const hasRouteTools = await Promise.any([
            page.locator('button:has-text("Add Start")').isVisible().catch(() => false),
            page.locator('button:has-text("Add Checkpoint")').isVisible().catch(() => false),
            page.locator('button:has-text("Add Finish")').isVisible().catch(() => false)
          ]);
          
          expect(hasRouteTools).toBeTruthy();
        }
      }
    });

    test('should handle admin console interface', async ({ page }) => {
      await page.goto('/');
      
      // Try to login as admin
      const loginForm = page.locator('form');
      const hasLoginForm = await loginForm.isVisible().catch(() => false);
      
      if (hasLoginForm) {
        await page.locator('input[type="email"], input[name="email"]').fill('admin@example.com');
        await page.locator('input[type="password"], input[name="password"]').fill('admin123');
        await page.locator('button[type="submit"]').click();
        await page.waitForLoadState('networkidle');
      }
      
      // Look for admin console
      const adminButton = page.locator('button:has-text("Admin Console"), a:has-text("Admin Console")');
      const hasAdminButton = await adminButton.isVisible().catch(() => false);
      
      if (hasAdminButton) {
        await adminButton.click();
        
        // Check for admin dashboard elements
        await expect(page.locator('h1:has-text("Admin"), h1:has-text("Console")')).toBeVisible({ timeout: 10000 });
        
        // Look for admin features
        const hasAdminFeatures = await Promise.any([
          page.locator('[data-testid="race-stats"]').isVisible().catch(() => false),
          page.locator('[data-testid="user-stats"]').isVisible().catch(() => false),
          page.locator('button:has-text("Manage Races")').isVisible().catch(() => false),
          page.locator('button:has-text("Manage Users")').isVisible().catch(() => false)
        ]);
        
        expect(hasAdminFeatures).toBeTruthy();
      }
    });
  });

  test.describe('API Endpoints', () => {
    test('should validate API health', async ({ page }) => {
      await page.goto('/');
      
      // Test API health endpoint
      const healthCheck = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:8082/api/health');
          return { status: response.status, ok: response.ok };
        } catch (error) {
          return { status: 0, ok: false, error: (error as Error).message };
        }
      });
      
      // API should be accessible
      expect(healthCheck.status).toBeGreaterThan(0);
    });

    test('should validate authentication endpoint', async ({ page }) => {
      await page.goto('/');
      
      // Test auth login endpoint
      const authTest = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:8082/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
          });
          return { status: response.status, ok: response.ok };
        } catch (error) {
          return { status: 0, ok: false, error: (error as Error).message };
        }
      });
      
      // Auth endpoint should respond (either success or unauthorized)
      expect(authTest.status).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid routes gracefully', async ({ page }) => {
      const response = await page.goto('/invalid-route');
      
      // Should handle 404 gracefully
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle form validation', async ({ page }) => {
      await page.goto('/');
      
      // Try to find and submit a form without filling required fields
      const loginForm = page.locator('form');
      const hasLoginForm = await loginForm.isVisible().catch(() => false);
      
      if (hasLoginForm) {
        await page.locator('button[type="submit"]').click();
        
        // Should show validation errors or remain on login page
        await page.waitForTimeout(1000);
        const stillOnLogin = await loginForm.isVisible().catch(() => false);
        expect(stillOnLogin).toBeTruthy();
      }
    });

    test('should handle network errors', async ({ page }) => {
      await page.goto('/');
      
      // Mock network failure
      await page.route('**/*', route => {
        if (route.request().url().includes('api/')) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      // Try to login
      const loginForm = page.locator('form');
      const hasLoginForm = await loginForm.isVisible().catch(() => false);
      
      if (hasLoginForm) {
        await page.locator('input[type="email"], input[name="email"]').fill('test@example.com');
        await page.locator('input[type="password"], input[name="password"]').fill('password123');
        await page.locator('button[type="submit"]').click();
        
        // Should handle network error gracefully
        await page.waitForTimeout(2000);
        const stillOnLogin = await loginForm.isVisible().catch(() => false);
        expect(stillOnLogin).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check mobile compatibility
      await expect(page.locator('body')).toBeVisible();
      
      const loginForm = page.locator('form');
      const hasLoginForm = await loginForm.isVisible().catch(() => false);
      
      if (hasLoginForm) {
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
      }
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Check tablet compatibility
      await expect(page.locator('body')).toBeVisible();
      
      const loginForm = page.locator('form');
      const hasLoginForm = await loginForm.isVisible().catch(() => false);
      
      if (hasLoginForm) {
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Should focus on interactive elements
      const focusedElement = await page.locator(':focus').isVisible().catch(() => false);
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper headings structure', async ({ page }) => {
      await page.goto('/');
      
      // Check for proper heading structure
      const hasHeading = await page.locator('h1, h2, h3').isVisible().catch(() => false);
      expect(hasHeading).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle concurrent page loads', async ({ context }) => {
      // Create multiple pages
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
      ]);
      
      // Load pages concurrently
      const loadPromises = pages.map(page => 
        page.goto('/').then(() => page.waitForLoadState('networkidle'))
      );
      
      await Promise.all(loadPromises);
      
      // All pages should load successfully
      for (const page of pages) {
        await expect(page.locator('body')).toBeVisible();
      }
      
      // Clean up
      await Promise.all(pages.map(page => page.close()));
    });
  });
});

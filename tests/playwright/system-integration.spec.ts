import { test, expect } from '@playwright/test';

test.describe('System Integration Tests', () => {
  test.describe('Authentication Flow', () => {
    test('should complete full authentication cycle', async ({ page }) => {
      await page.goto('/');
      
      // Test login form visibility
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // Test registration
      await page.locator('button:has-text("Register")').click();
      await expect(page.locator('input[name="name"]')).toBeVisible();
      
      const timestamp = Date.now();
      await page.locator('input[name="name"]').fill(`Test User ${timestamp}`);
      await page.locator('input[name="email"]').fill(`test${timestamp}@example.com`);
      await page.locator('input[name="password"]').fill('password123');
      await page.locator('input[name="confirmPassword"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      // Should redirect to main app or show success
      await expect(page.locator('body')).toContainText('Welcome', { timeout: 10000 });
      
      // Test logout
      await page.locator('button:has-text("Logout")').click();
      await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
      
      // Test login with new credentials
      await page.locator('input[type="email"]').fill(`test${timestamp}@example.com`);
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await expect(page.locator('body')).toContainText('Welcome', { timeout: 10000 });
    });

    test('should handle authentication errors', async ({ page }) => {
      await page.goto('/');
      
      // Test invalid login
      await page.locator('input[type="email"]').fill('invalid@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();
      
      await expect(page.locator('body')).toContainText('Invalid credentials', { timeout: 5000 });
    });
  });

  test.describe('Race Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login for race management tests
      await page.goto('/');
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    });

    test('should create and manage races', async ({ page }) => {
      // Navigate to race creation
      await page.locator('button:has-text("Create Race")').click();
      
      // Fill race form
      const timestamp = Date.now();
      await page.locator('input[name="name"]').fill(`Test Race ${timestamp}`);
      await page.locator('textarea[name="description"]').fill('A comprehensive test race');
      
      // Select race type
      await page.locator('select[name="type"]').selectOption('circuit');
      
      // Configure participants
      await page.locator('input[name="maxParticipants"]').fill('10');
      
      // Set start time
      const startTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);
      await page.locator('input[name="startTime"]').fill(startTime);
      
      // Submit race
      await page.locator('button[type="submit"]').click();
      
      // Verify race creation
      await expect(page.locator('body')).toContainText('Race created successfully', { timeout: 10000 });
      
      // Navigate to race list
      await page.goto('/');
      await expect(page.locator('body')).toContainText(`Test Race ${timestamp}`, { timeout: 5000 });
    });

    test('should join and leave races', async ({ page }) => {
      // Find available race
      await page.goto('/');
      const raceCard = page.locator('[data-testid="race-card"]').first();
      if (await raceCard.isVisible()) {
        await raceCard.click();
        
        // Join race
        await page.locator('button:has-text("Join Race")').click();
        await expect(page.locator('body')).toContainText('Joined race successfully', { timeout: 5000 });
        
        // Leave race
        await page.locator('button:has-text("Leave Race")').click();
        await expect(page.locator('body')).toContainText('Left race successfully', { timeout: 5000 });
      }
    });
  });

  test.describe('Route Builder', () => {
    test.beforeEach(async ({ page }) => {
      // Login for route builder tests
      await page.goto('/');
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    });

    test('should create custom routes', async ({ page }) => {
      // Navigate to race creation
      await page.locator('button:has-text("Create Race")').click();
      
      // Open route builder
      await page.locator('button:has-text("Create New Route")').click();
      
      // Wait for map to load
      await expect(page.locator('#map')).toBeVisible({ timeout: 10000 });
      
      // Test route creation tools
      await expect(page.locator('button:has-text("Add Start")')).toBeVisible();
      await expect(page.locator('button:has-text("Add Checkpoint")')).toBeVisible();
      await expect(page.locator('button:has-text("Add Finish")')).toBeVisible();
      
      // Create a simple route
      await page.locator('button:has-text("Add Start")').click();
      // Simulate clicking on map
      await page.locator('#map').click({ position: { x: 200, y: 200 } });
      
      await page.locator('button:has-text("Add Finish")').click();
      await page.locator('#map').click({ position: { x: 400, y: 200 } });
      
      // Save route
      await page.locator('button:has-text("Save Route")').click();
      await page.locator('input[name="routeName"]').fill('Test Route');
      await page.locator('button:has-text("Confirm")').click();
      
      // Verify route was created
      await expect(page.locator('body')).toContainText('Route created successfully', { timeout: 10000 });
      
      // Should return to race creation with route selected
      await expect(page.locator('body')).toContainText('Test Route', { timeout: 5000 });
    });

    test('should validate route types', async ({ page }) => {
      // Navigate to route builder
      await page.locator('button:has-text("Create Race")').click();
      await page.locator('button:has-text("Create New Route")').click();
      
      // Test different race types
      await page.locator('select[name="raceType"]').selectOption('sprint');
      await expect(page.locator('body')).toContainText('Point-to-point race', { timeout: 5000 });
      
      await page.locator('select[name="raceType"]').selectOption('circuit');
      await expect(page.locator('body')).toContainText('Closed loop required', { timeout: 5000 });
      
      await page.locator('select[name="raceType"]').selectOption('time-trial');
      await expect(page.locator('body')).toContainText('Checkpoint registration', { timeout: 5000 });
    });
  });

  test.describe('Admin Console', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/');
      await page.locator('input[type="email"]').fill('admin@example.com');
      await page.locator('input[type="password"]').fill('admin123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    });

    test('should access admin console', async ({ page }) => {
      // Navigate to admin console
      await page.locator('button:has-text("Admin Console")').click();
      
      // Verify admin dashboard
      await expect(page.locator('h1:has-text("Race Admin Console")')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="race-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
    });

    test('should manage races from admin console', async ({ page }) => {
      await page.locator('button:has-text("Admin Console")').click();
      
      // View race management
      await page.locator('button:has-text("Manage Races")').click();
      await expect(page.locator('[data-testid="race-list"]')).toBeVisible({ timeout: 5000 });
      
      // Test race controls
      const raceRow = page.locator('[data-testid="race-row"]').first();
      if (await raceRow.isVisible()) {
        await raceRow.locator('button:has-text("Control")').click();
        
        // Test flag controls
        await expect(page.locator('button:has-text("Green Flag")')).toBeVisible();
        await expect(page.locator('button:has-text("Yellow Flag")')).toBeVisible();
        await expect(page.locator('button:has-text("Red Flag")')).toBeVisible();
        
        // Test safety car
        await expect(page.locator('button:has-text("Deploy Safety Car")')).toBeVisible();
      }
    });

    test('should manage users from admin console', async ({ page }) => {
      await page.locator('button:has-text("Admin Console")').click();
      
      // View user management
      await page.locator('button:has-text("Manage Users")').click();
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible({ timeout: 5000 });
      
      // Test user actions
      const userRow = page.locator('[data-testid="user-row"]').first();
      if (await userRow.isVisible()) {
        await expect(userRow.locator('button:has-text("Edit")')).toBeVisible();
        await expect(userRow.locator('button:has-text("Ban")')).toBeVisible();
      }
    });
  });

  test.describe('Real-time Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    });

    test('should establish WebSocket connection', async ({ page }) => {
      // Navigate to a race
      const raceCard = page.locator('[data-testid="race-card"]').first();
      if (await raceCard.isVisible()) {
        await raceCard.click();
        
        // Check for real-time updates
        await expect(page.locator('[data-testid="live-timing"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
        
        // Test WebSocket connection status
        const connectionStatus = page.locator('[data-testid="connection-status"]');
        if (await connectionStatus.isVisible()) {
          await expect(connectionStatus).toContainText('Connected', { timeout: 5000 });
        }
      }
    });

    test('should handle real-time race updates', async ({ page }) => {
      // This would require mocking real-time data or having another browser simulate race updates
      // For now, we'll test the UI components that would display real-time data
      
      const raceCard = page.locator('[data-testid="race-card"]').first();
      if (await raceCard.isVisible()) {
        await raceCard.click();
        
        // Test live race view components
        await expect(page.locator('[data-testid="race-map"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('[data-testid="position-tracker"]')).toBeVisible();
        await expect(page.locator('[data-testid="lap-counter"]')).toBeVisible();
      }
    });
  });

  test.describe('API Endpoints', () => {
    test('should validate all API endpoints', async ({ page }) => {
      // Test API endpoints through the browser
      await page.goto('/');
      
      // Test health endpoint
      const healthResponse = await page.evaluate(async () => {
        const response = await fetch('http://localhost:8082/api/health');
        return response.ok;
      });
      expect(healthResponse).toBeTruthy();
      
      // Test auth endpoints
      const loginResponse = await page.evaluate(async () => {
        const response = await fetch('http://localhost:8082/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        });
        return response.ok;
      });
      expect(loginResponse).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle form validation errors', async ({ page }) => {
      await page.goto('/');
      await page.locator('button:has-text("Create Race")').click();
      
      // Try to submit empty form
      await page.locator('button[type="submit"]').click();
      
      // Should show validation errors
      await expect(page.locator('body')).toContainText('Race name is required', { timeout: 5000 });
    });

    test('should handle network timeouts', async ({ page }) => {
      await page.goto('/');
      
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 5000);
      });
      
      // Try to login
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      // Should handle slow response gracefully
      await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Performance and Load', () => {
    test('should handle concurrent users', async ({ context }) => {
      // Create multiple browser contexts to simulate concurrent users
      const contexts = await Promise.all([
        context.browser().newContext(),
        context.browser().newContext(),
        context.browser().newContext()
      ]);
      
      const pages = await Promise.all(
        contexts.map(ctx => ctx.newPage())
      );
      
      // Have all users login simultaneously
      await Promise.all(
        pages.map(async (page, index) => {
          await page.goto('/');
          await page.locator('input[type="email"]').fill(`user${index}@example.com`);
          await page.locator('input[type="password"]').fill('password123');
          await page.locator('button[type="submit"]').click();
          await page.waitForLoadState('networkidle');
        })
      );
      
      // Verify all users can access the system
      await Promise.all(
        pages.map(async page => {
          await expect(page.locator('body')).toContainText('Welcome', { timeout: 10000 });
        })
      );
      
      // Clean up
      await Promise.all(contexts.map(ctx => ctx.close()));
    });

    test('should handle large race lists', async ({ page }) => {
      await page.goto('/');
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
      
      // Test race list loading
      await expect(page.locator('[data-testid="race-list"]')).toBeVisible({ timeout: 10000 });
      
      // Test scrolling behavior using page.evaluate
      await page.evaluate(() => {
        const raceList = document.querySelector('[data-testid="race-list"]');
        if (raceList && raceList instanceof HTMLElement) {
          raceList.scrollTop = raceList.scrollHeight;
        }
      });
      await page.waitForTimeout(1000);
      
      // Should either load more races or show end of list
      const hasMoreRaces = await page.locator('[data-testid="load-more"]').isVisible();
      if (hasMoreRaces) {
        await page.locator('[data-testid="load-more"]').click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      // Check for proper ARIA labels
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute('aria-label', 'Email');
      
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toHaveAttribute('aria-label', 'Password');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Test mobile layout
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // Test mobile navigation
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await expect(page.locator('body')).toContainText('Welcome', { timeout: 10000 });
    });

    test('should adapt to tablet screens', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/');
      
      // Test tablet layout
      await expect(page.locator('form')).toBeVisible();
      
      // Login and test race list on tablet
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      await expect(page.locator('[data-testid="race-list"]')).toBeVisible({ timeout: 10000 });
    });
  });
});

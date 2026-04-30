import { test, expect } from '@playwright/test';

test.describe('Screenshot Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('generate mobile team management screenshot', async ({ page }) => {
    await page.goto('/mobile-demo');
    
    // Wait for mobile demo to load
    await page.waitForLoadState('networkidle');
    
    // Click on participant view to show team management
    await page.locator('button:has-text("Race Participant")').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of mobile team management
    await page.screenshot({ 
      path: 'docs/assets/mobile-team-management.png',
      fullPage: false 
    });
  });

  test('generate live racing interface screenshot', async ({ page }) => {
    await page.goto('/showcase');
    
    // Wait for showcase to load
    await page.waitForLoadState('networkidle');
    
    // Look for race interface elements
    await page.waitForSelector('[data-testid="race-interface"], .race-interface, main', { timeout: 10000 });
    
    // Take screenshot of live racing interface
    await page.screenshot({ 
      path: 'docs/assets/live-racing-interface.png',
      fullPage: false 
    });
  });

  test('generate race replay system screenshot', async ({ page }) => {
    await page.goto('/replay-demo');
    
    // Wait for replay demo to load
    await page.waitForLoadState('networkidle');
    
    // Look for replay controls
    await page.waitForSelector('[data-testid="replay-controls"], .replay-controls', { timeout: 10000 });
    
    // Take screenshot of race replay system
    await page.screenshot({ 
      path: 'docs/assets/race-replay-system.png',
      fullPage: false 
    });
  });

  test('generate admin panel screenshot', async ({ page }) => {
    await page.goto('/showcase');
    
    // Wait for showcase to load
    await page.waitForLoadState('networkidle');
    
    // Look for admin panel elements
    const adminPanel = await page.locator('[data-testid="admin-panel"], .admin-panel, .admin-console').first();
    if (await adminPanel.isVisible().catch(() => false)) {
      await adminPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Take screenshot of admin panel
      await adminPanel.screenshot({ 
        path: 'docs/assets/admin-panel.png'
      });
    } else {
      // Fallback: take screenshot of main interface
      await page.screenshot({ 
        path: 'docs/assets/admin-panel.png',
        fullPage: false 
      });
    }
  });

  test('generate leaderboard screenshot', async ({ page }) => {
    await page.goto('/leaderboard-demo');
    
    // Wait for leaderboard demo to load
    await page.waitForLoadState('networkidle');
    
    // Look for leaderboard elements
    await page.waitForSelector('[data-testid="leaderboard"], .leaderboard', { timeout: 10000 });
    
    // Take screenshot of leaderboard
    await page.screenshot({ 
      path: 'docs/assets/leaderboard.png',
      fullPage: false 
    });
  });

  test('generate mobile racing interface screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/mobile-demo');
    
    // Wait for mobile demo to load
    await page.waitForLoadState('networkidle');
    
    // Click on participant view to show racing interface
    await page.locator('button:has-text("Race Participant")').click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of mobile racing interface
    await page.screenshot({ 
      path: 'docs/assets/mobile-racing-interface.png',
      fullPage: false 
    });
  });

  test('generate route builder screenshot', async ({ page }) => {
    await page.goto('/route-demo');
    
    // Wait for route demo to load
    await page.waitForLoadState('networkidle');
    
    // Look for map and route building tools
    await page.waitForSelector('#map, .leaflet-container, [data-testid="map"]', { timeout: 10000 });
    
    // Take screenshot of route builder
    await page.screenshot({ 
      path: 'docs/assets/route-builder.png',
      fullPage: false 
    });
  });

  test('generate team dashboard screenshot', async ({ page }) => {
    await page.goto('/showcase');
    
    // Wait for showcase to load
    await page.waitForLoadState('networkidle');
    
    // Look for team dashboard elements
    const teamDashboard = await page.locator('[data-testid="team-dashboard"], .team-dashboard').first();
    if (await teamDashboard.isVisible().catch(() => false)) {
      await teamDashboard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Take screenshot of team dashboard
      await teamDashboard.screenshot({ 
        path: 'docs/assets/team-dashboard.png'
      });
    } else {
      // Fallback: take screenshot of main interface
      await page.screenshot({ 
        path: 'docs/assets/team-dashboard.png',
        fullPage: false 
      });
    }
  });
});

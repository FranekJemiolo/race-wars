import { test, expect } from '@playwright/test';

test.describe('Generate Real Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('generate mobile team management screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to mobile demo
    await page.goto('/mobile-demo');
    await page.waitForLoadState('networkidle');
    
    // Wait for mobile demo to load
    await page.waitForSelector('text=/Race Wars Mobile/i, h1', { timeout: 10000 });
    
    // Click on participant view to show team management interface
    await page.locator('button:has-text("Race Participant")').click();
    await page.waitForTimeout(2000);
    
    // Take screenshot of mobile team management interface
    await page.screenshot({ 
      path: 'docs/assets/mobile-team-management.png',
      fullPage: false 
    });
  });

  test('generate live racing interface screenshot', async ({ page }) => {
    // Navigate to showcase
    await page.goto('/showcase');
    await page.waitForLoadState('networkidle');
    
    // Wait for showcase to load
    await page.waitForSelector('h1, main, [data-testid="showcase"]', { timeout: 10000 });
    
    // Look for race interface elements
    const raceInterface = await page.locator('.race-interface, .racing-interface, main').first();
    if (await raceInterface.isVisible().catch(() => false)) {
      await raceInterface.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Take screenshot of live racing interface
      await raceInterface.screenshot({ 
        path: 'docs/assets/live-racing-interface.png'
      });
    } else {
      // Fallback: take screenshot of main showcase area
      await page.screenshot({ 
        path: 'docs/assets/live-racing-interface.png',
        fullPage: false 
      });
    }
  });

  test('generate race replay system screenshot', async ({ page }) => {
    // Navigate to replay demo
    await page.goto('/replay-demo');
    await page.waitForLoadState('networkidle');
    
    // Wait for replay demo to load
    await page.waitForSelector('h1, main, [data-testid="replay-demo"]', { timeout: 10000 });
    
    // Look for replay controls and interface
    const replayInterface = await page.locator('.replay-interface, .replay-controls, main').first();
    if (await replayInterface.isVisible().catch(() => false)) {
      await replayInterface.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Take screenshot of race replay system
      await replayInterface.screenshot({ 
        path: 'docs/assets/race-replay-system.png'
      });
    } else {
      // Fallback: take screenshot of replay demo page
      await page.screenshot({ 
        path: 'docs/assets/race-replay-system.png',
        fullPage: false 
      });
    }
  });

  test('generate admin panel screenshot', async ({ page }) => {
    // Navigate to showcase
    await page.goto('/showcase');
    await page.waitForLoadState('networkidle');
    
    // Wait for showcase to load
    await page.waitForSelector('h1, main, [data-testid="showcase"]', { timeout: 10000 });
    
    // Look for admin panel elements
    const adminPanel = await page.locator('.admin-panel, .admin-console, [data-testid="admin"]').first();
    if (await adminPanel.isVisible().catch(() => false)) {
      await adminPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
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
    // Navigate to leaderboard demo
    await page.goto('/leaderboard-demo');
    await page.waitForLoadState('networkidle');
    
    // Wait for leaderboard demo to load
    await page.waitForSelector('h1, main, [data-testid="leaderboard-demo"]', { timeout: 10000 });
    
    // Look for leaderboard elements
    const leaderboard = await page.locator('.leaderboard, [data-testid="leaderboard"], main').first();
    if (await leaderboard.isVisible().catch(() => false)) {
      await leaderboard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Take screenshot of leaderboard
      await leaderboard.screenshot({ 
        path: 'docs/assets/leaderboard.png'
      });
    } else {
      // Fallback: take screenshot of leaderboard demo page
      await page.screenshot({ 
        path: 'docs/assets/leaderboard.png',
        fullPage: false 
      });
    }
  });

  test('generate mobile racing interface screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to mobile demo
    await page.goto('/mobile-demo');
    await page.waitForLoadState('networkidle');
    
    // Wait for mobile demo to load
    await page.waitForSelector('text=/Race Wars Mobile/i, h1', { timeout: 10000 });
    
    // Click on participant view to show racing interface
    await page.locator('button:has-text("Race Participant")').click();
    await page.waitForTimeout(2000);
    
    // Take screenshot of mobile racing interface
    await page.screenshot({ 
      path: 'docs/assets/mobile-racing-interface.png',
      fullPage: false 
    });
  });

  test('generate route builder screenshot', async ({ page }) => {
    // Navigate to route demo
    await page.goto('/route-demo');
    await page.waitForLoadState('networkidle');
    
    // Wait for route demo to load
    await page.waitForSelector('h1, main, [data-testid="route-demo"]', { timeout: 10000 });
    
    // Look for map and route building tools
    const routeBuilder = await page.locator('.route-builder, .map-interface, main').first();
    if (await routeBuilder.isVisible().catch(() => false)) {
      await routeBuilder.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Take screenshot of route builder
      await routeBuilder.screenshot({ 
        path: 'docs/assets/route-builder.png'
      });
    } else {
      // Fallback: take screenshot of route demo page
      await page.screenshot({ 
        path: 'docs/assets/route-builder.png',
        fullPage: false 
      });
    }
  });

  test('generate team dashboard screenshot', async ({ page }) => {
    // Navigate to showcase
    await page.goto('/showcase');
    await page.waitForLoadState('networkidle');
    
    // Wait for showcase to load
    await page.waitForSelector('h1, main, [data-testid="showcase"]', { timeout: 10000 });
    
    // Look for team dashboard elements
    const teamDashboard = await page.locator('.team-dashboard, .team-interface, main').first();
    if (await teamDashboard.isVisible().catch(() => false)) {
      await teamDashboard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
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

  test('generate comprehensive app showcase screenshot', async ({ page }) => {
    // Navigate to main showcase
    await page.goto('/showcase');
    await page.waitForLoadState('networkidle');
    
    // Wait for showcase to load
    await page.waitForSelector('h1, main, [data-testid="showcase"]', { timeout: 10000 });
    
    // Take full page screenshot of showcase
    await page.screenshot({ 
      path: 'docs/assets/showcase-main.png',
      fullPage: true 
    });
  });

  test('generate mobile app showcase screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to mobile demo
    await page.goto('/mobile-demo');
    await page.waitForLoadState('networkidle');
    
    // Wait for mobile demo to load
    await page.waitForSelector('text=/Race Wars Mobile/i, h1', { timeout: 10000 });
    
    // Take screenshot of mobile app selection screen
    await page.screenshot({ 
      path: 'docs/assets/mobile-app-showcase.png',
      fullPage: false 
    });
  });
});

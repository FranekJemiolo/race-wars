import { test, expect } from '@playwright/test';

test.describe('Robust UI Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Use the correct port where the dev server is running
    await page.goto('http://localhost:5176/');
    await page.waitForLoadState('networkidle');
    
    // Wait for the app to load with a longer timeout
    await page.waitForTimeout(5000);
  });

  test('should load application and show content', async ({ page }) => {
    // Take a screenshot to verify the app loaded
    await page.screenshot({ path: 'robust-test-initial-state.png' });
    
    // Check if the page has loaded
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    expect(pageTitle).toBeTruthy();
    
    // Check for any visible content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for the application root
    const root = page.locator('#root');
    const rootVisible = await root.isVisible().catch(() => false);
    console.log('Root element visible:', rootVisible);
    
    // Check for any text content
    const bodyText = await page.textContent('body');
    console.log('Body content length:', bodyText?.length);
    console.log('Body content preview:', bodyText?.substring(0, 100));
    
    // Look for common application elements
    const appElements = [
      'main',
      '[data-testid]',
      '.app',
      '.container',
      'h1', 'h2', 'h3',
      'button',
      'input',
      'form'
    ];
    
    let foundElements = 0;
    for (const selector of appElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        foundElements += count;
        
        // Check if any are visible
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const text = await element.textContent();
            console.log(`Visible element (${selector}): ${text?.substring(0, 50)}`);
          }
        }
      }
    }
    
    console.log(`Total app elements found: ${foundElements}`);
    expect(foundElements).toBeGreaterThan(0);
  });

  test('should check for race-related UI elements', async ({ page }) => {
    // Look for race-specific elements
    const raceSelectors = [
      'text=/race/i',
      'text=/racing/i',
      'text=/competition/i',
      'text=/track/i',
      'text=/lap/i',
      'text=/finish/i',
      'text=/start/i',
      '[data-testid*="race"]',
      '[data-testid*="track"]',
      '[data-testid*="lap"]'
    ];
    
    let raceElementsFound = 0;
    for (const selector of raceSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        console.log(`Found race element: ${text}`);
        raceElementsFound++;
      }
    }
    
    console.log(`Race elements found: ${raceElementsFound}`);
    
    // Take screenshot for race elements
    await page.screenshot({ path: 'robust-test-race-elements.png' });
  });

  test('should check for team-related UI elements', async ({ page }) => {
    // Look for team-specific elements
    const teamSelectors = [
      'text=/team/i',
      'text=/member/i',
      'text=/player/i',
      'text=/participant/i',
      'text=/group/i',
      '[data-testid*="team"]',
      '[data-testid*="member"]',
      '[data-testid*="player"]'
    ];
    
    let teamElementsFound = 0;
    for (const selector of teamSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        console.log(`Found team element: ${text}`);
        teamElementsFound++;
      }
    }
    
    console.log(`Team elements found: ${teamElementsFound}`);
    
    // Take screenshot for team elements
    await page.screenshot({ path: 'robust-test-team-elements.png' });
  });

  test('should check for leaderboard UI elements', async ({ page }) => {
    // Look for leaderboard-specific elements
    const leaderboardSelectors = [
      'text=/leaderboard/i',
      'text=/ranking/i',
      'text=/score/i',
      'text=/points/i',
      'text=/position/i',
      'text=/standings/i',
      '[data-testid*="leaderboard"]',
      '[data-testid*="ranking"]',
      '[data-testid*="score"]'
    ];
    
    let leaderboardElementsFound = 0;
    for (const selector of leaderboardSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        console.log(`Found leaderboard element: ${text}`);
        leaderboardElementsFound++;
      }
    }
    
    console.log(`Leaderboard elements found: ${leaderboardElementsFound}`);
    
    // Take screenshot for leaderboard elements
    await page.screenshot({ path: 'robust-test-leaderboard-elements.png' });
  });

  test('should check for authentication UI elements', async ({ page }) => {
    // Look for authentication-specific elements
    const authSelectors = [
      'text=/login/i',
      'text=/register/i',
      'text=/sign/i',
      'text=/auth/i',
      'text=/username/i',
      'text=/password/i',
      'text=/email/i',
      'input[type="text"]',
      'input[type="password"]',
      'input[type="email"]',
      'form',
      '[data-testid*="auth"]',
      '[data-testid*="login"]',
      '[data-testid*="register"]'
    ];
    
    let authElementsFound = 0;
    for (const selector of authSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        console.log(`Found auth element: ${text}`);
        authElementsFound++;
      }
    }
    
    console.log(`Auth elements found: ${authElementsFound}`);
    
    // Take screenshot for auth elements
    await page.screenshot({ path: 'robust-test-auth-elements.png' });
  });

  test('should check for interactive elements', async ({ page }) => {
    // Look for any interactive elements
    const interactiveSelectors = [
      'button',
      'input[type="button"]',
      'input[type="submit"]',
      'a[href]',
      'select',
      'textarea',
      '[role="button"]',
      '[tabindex]'
    ];
    
    let interactiveElementsFound = 0;
    for (const selector of interactiveSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`Found ${count} interactive elements: ${selector}`);
        interactiveElementsFound += count;
        
        // Check if any are visible
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const text = await element.textContent();
            console.log(`Visible interactive element (${selector}): ${text?.substring(0, 50)}`);
          }
        }
      }
    }
    
    console.log(`Interactive elements found: ${interactiveElementsFound}`);
    
    // Take screenshot for interactive elements
    await page.screenshot({ path: 'robust-test-interactive-elements.png' });
  });

  test('should verify overall application state', async ({ page }) => {
    // Final verification of the application state
    const finalScreenshot = await page.screenshot({ path: 'robust-test-final-state.png' });
    
    // Check if the page is fully loaded
    const isReady = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(isReady).toBeTruthy();
    
    // Check for any JavaScript errors
    const errors = await page.evaluate(() => {
      return (window as any).errors || [];
    });
    
    console.log(`JavaScript errors: ${errors.length}`);
    
    // Get the final page content
    const finalContent = await page.textContent('body');
    console.log(`Final content length: ${finalContent?.length}`);
    
    // Verify we have some content
    expect(finalContent).toBeTruthy();
    expect(finalContent!.length).toBeGreaterThan(0);
  });
});

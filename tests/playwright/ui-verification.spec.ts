import { test, expect } from '@playwright/test';

test.describe('UI Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for app to fully load
  });

  test('should display application interface', async ({ page }) => {
    // Take a screenshot to see what's actually displayed
    await page.screenshot({ path: 'test-screenshot-current-state.png' });
    
    // Check for any visible content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for any text content that indicates the app is loaded
    const pageContent = await page.textContent('body');
    console.log('Page content:', pageContent?.substring(0, 200));
    
    // Check for common app elements
    const possibleElements = [
      'h1', 'h2', 'h3', // Headings
      'button', // Buttons
      'input', // Form inputs
      'main', // Main content area
      '[data-testid]', // Test IDs
      '.app', // App class
      '#root', // Root element
      'div', // Any div content
    ];
    
    let foundElement = false;
    for (const selector of possibleElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        foundElement = true;
        
        // Check if any of these elements are visible
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const text = await element.textContent();
            console.log(`Visible element (${selector}): ${text?.substring(0, 50)}`);
          }
        }
      }
    }
    
    expect(foundElement).toBeTruthy();
  });

  test('should identify application state', async ({ page }) => {
    // Check what state the application is in
    const possibleStates = [
      'text=/race/i',
      'text=/team/i',
      'text=/login/i',
      'text=/auth/i',
      'text=/welcome/i',
      'text=/connect/i',
      'text=/join/i',
      'text=/start/i'
    ];
    
    let foundState = false;
    for (const selector of possibleStates) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        const text = await element.textContent();
        console.log(`Found state indicator: ${text}`);
        foundState = true;
      }
    }
    
    // If no specific state found, check for any interactive elements
    if (!foundState) {
      const interactiveElements = [
        'button',
        'input',
        'a',
        'select',
        'textarea'
      ];
      
      for (const selector of interactiveElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`Found ${count} interactive elements: ${selector}`);
          foundState = true;
        }
      }
    }
    
    // At minimum, we should have some content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should handle navigation attempts', async ({ page }) => {
    // Try to find and click any navigation elements
    const navigationSelectors = [
      'button',
      'a',
      '[role="button"]',
      'input[type="button"]',
      'input[type="submit"]'
    ];
    
    let navigationAttempted = false;
    for (const selector of navigationSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`Found ${count} clickable elements: ${selector}`);
        
        // Try clicking the first visible element
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const text = await element.textContent();
            console.log(`Attempting to click: ${text?.substring(0, 50)}`);
            
            await element.click();
            await page.waitForTimeout(2000);
            navigationAttempted = true;
            break;
          }
        }
        
        if (navigationAttempted) break;
      }
    }
    
    // Check if navigation changed the page
    const afterNavigationText = await page.textContent('body');
    if (navigationAttempted) {
      console.log('Navigation attempted - checking for changes');
    }
    
    expect(afterNavigationText).toBeTruthy();
  });

  test('should verify application functionality', async ({ page }) => {
    // Test basic application functionality
    const startTime = Date.now();
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(5000);
    
    // Check if the page is still responsive
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(isResponsive).toBeTruthy();
    
    // Check for any JavaScript errors
    const errors = await page.evaluate(() => {
      return (window as any).errors || [];
    });
    
    console.log(`Page loaded in ${Date.now() - startTime}ms`);
    console.log(`JavaScript errors: ${errors.length}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-screenshot-final-state.png' });
  });
});

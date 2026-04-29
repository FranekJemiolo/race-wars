import { test, expect } from '@playwright/test';

test.describe('Basic Screenshot Generation', () => {
  test('generate showcase screenshots', async ({ page }) => {
    // Navigate to the main app first
    await page.goto('http://localhost:5173');
    
    // Wait for the app to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot of the main app
    await page.screenshot({
      path: 'docs/assets/main-app.png',
      fullPage: true,
    });

    // Try to navigate to showcase
    await page.goto('http://localhost:5173/#showcase');
    await page.waitForTimeout(3000);
    
    // Take screenshot regardless of what loads
    await page.screenshot({
      path: 'docs/assets/showcase-page.png',
      fullPage: true,
    });

    // If we can find any buttons, click them
    try {
      const buttons = await page.locator('button').all();
      if (buttons.length > 0) {
        console.log(`Found ${buttons.length} buttons`);
        
        // Click first few buttons and take screenshots
        for (let i = 0; i < Math.min(3, buttons.length); i++) {
          await buttons[i].click();
          await page.waitForTimeout(1000);
          await page.screenshot({
            path: `docs/assets/button-${i}.png`,
            fullPage: true,
          });
        }
      }
    } catch (error) {
      console.log('No buttons found, continuing...');
    }

    // Try mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'docs/assets/mobile-view.png',
      fullPage: true,
    });
  });
});

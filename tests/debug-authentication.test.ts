import { test, expect } from '@playwright/test';

test.describe('Debug Authentication Flow', () => {
  test('Test authentication process step by step', async ({ page }) => {
    test.setTimeout(30000);
    
    // Enable console logging
    page.on('console', msg => {
      console.log('CONSOLE:', msg.type(), msg.text());
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('API RESPONSE:', response.url(), response.status());
      }
    });
    
    // Navigate to the page
    await page.goto('http://localhost');
    
    // Wait for React app to load
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    
    console.log('✅ Login form loaded');
    
    // Fill in login credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    console.log('✅ Login credentials filled');
    
    // Check if submit button exists and is clickable
    const submitButton = await page.$('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    
    const buttonText = await submitButton.textContent();
    console.log('Submit button text:', buttonText);
    
    // Click submit button
    await page.click('button[type="submit"]');
    
    console.log('✅ Submit button clicked');
    
    // Wait for potential authentication response
    await page.waitForTimeout(5000);
    
    // Check if we're still on auth screen
    const authScreen = await page.$('input[name="username"]');
    console.log('Auth screen still present:', !!authScreen);
    
    // Look for any error messages
    const errorElements = await page.$$('text=Error, text=Invalid, text=Failed');
    console.log('Error elements found:', errorElements.length);
    
    if (errorElements.length > 0) {
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log(`Error ${i}:`, errorText);
      }
    }
    
    // Look for success indicators (race selection, etc.)
    const raceSelection = await page.$('text=Race Selection');
    const connectionScreen = await page.$('text=Connect, text=Server');
    const raceList = await page.$('text=Join Race, text=Create Race');
    
    console.log('Race selection found:', !!raceSelection);
    console.log('Connection screen found:', !!connectionScreen);
    console.log('Race list found:', !!raceList);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-authentication.png', fullPage: true });
    console.log('Screenshot saved as debug-authentication.png');
    
    // Check if we made any progress
    const progress = !authScreen || raceSelection || connectionScreen || raceList;
    console.log('Authentication progress made:', progress);
  });
});

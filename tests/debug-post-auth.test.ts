import { test, expect } from '@playwright/test';

test.describe('Debug Post-Authentication Flow', () => {
  test('Check what screen appears after login', async ({ page }) => {
    test.setTimeout(30000);
    
    // Enable console logging
    page.on('console', msg => {
      console.log('CONSOLE:', msg.type(), msg.text());
    });
    
    // Navigate to the page
    await page.goto('http://localhost');
    
    // Wait for React app to load
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    
    // Login with correct credentials
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // Wait for transition
    await page.waitForTimeout(5000);
    
    // Check what elements are present after login
    const authScreen = await page.$('input[name="username"]');
    const raceSelection = await page.$('text=Race Selection');
    const connectionScreen = await page.$('text=Connect, text=Server, text=Connection');
    const raceList = await page.$('text=Join Race, text=Create Race, text=Available Races');
    const raceItems = await page.$$('div:has-text("Join Race"), button:has-text("Join Race")');
    
    console.log('Auth screen still present:', !!authScreen);
    console.log('Race selection found:', !!raceSelection);
    console.log('Connection screen found:', !!connectionScreen);
    console.log('Race list found:', !!raceList);
    console.log('Race items found:', raceItems.length);
    
    // Look for any text content that might indicate the current screen
    const pageText = await page.textContent('body');
    console.log('Page text preview:', pageText?.substring(0, 200));
    
    // Look for specific elements that might be on the post-auth screen
    const buttons = await page.$$('button');
    console.log('Total buttons found:', buttons.length);
    
    for (let i = 0; i < Math.min(5, buttons.length); i++) {
      const buttonText = await buttons[i].textContent();
      console.log(`Button ${i}:`, buttonText);
    }
    
    // Look for any input elements (might be server connection)
    const inputs = await page.$$('input');
    console.log('Input elements found:', inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const inputType = await inputs[i].getAttribute('type');
      const inputPlaceholder = await inputs[i].getAttribute('placeholder');
      console.log(`Input ${i}: type=${inputType}, placeholder=${inputPlaceholder}`);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-post-auth.png', fullPage: true });
    console.log('Screenshot saved as debug-post-auth.png');
  });
});

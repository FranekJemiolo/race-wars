import { test, expect } from '@playwright/test';

test.describe('Debug React Loading Issues', () => {
  test('Check React app loading process', async ({ page }) => {
    test.setTimeout(30000);
    
    // Enable console logging
    page.on('console', msg => {
      console.log('CONSOLE:', msg.type(), msg.text());
    });
    
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    // Navigate to the page
    await page.goto('http://localhost');
    
    // Wait for initial HTML to load
    await page.waitForLoadState('networkidle');
    
    // Check if the root div exists
    const rootDiv = await page.$('#root');
    console.log('Root div exists:', !!rootDiv);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Wait a bit for React to potentially load
    await page.waitForTimeout(5000);
    
    // Check what's actually in the root div
    const rootContent = await page.$eval('#root', el => el.innerHTML);
    console.log('Root div content length:', rootContent.length);
    console.log('Root div content preview:', rootContent.substring(0, 200));
    
    // Look for any React-related elements
    const reactElements = await page.$$('div[class*="App"], div[data-reactroot], [data-testid]');
    console.log('React elements found:', reactElements.length);
    
    // Check for any input elements (login form)
    const inputElements = await page.$$('input');
    console.log('Input elements found:', inputElements.length);
    
    if (inputElements.length > 0) {
      for (let i = 0; i < inputElements.length; i++) {
        const inputType = await inputElements[i].getAttribute('type');
        const inputName = await inputElements[i].getAttribute('name');
        const inputPlaceholder = await inputElements[i].getAttribute('placeholder');
        console.log(`Input ${i}: type=${inputType}, name=${inputName}, placeholder=${inputPlaceholder}`);
      }
    }
    
    // Check for any buttons
    const buttonElements = await page.$$('button');
    console.log('Button elements found:', buttonElements.length);
    
    // Check for any form elements
    const formElements = await page.$$('form');
    console.log('Form elements found:', formElements.length);
    
    // Wait longer and check again
    await page.waitForTimeout(10000);
    
    // Final check for login form
    const loginForm = await page.$('input[name="username"]');
    console.log('Login form found after 15 seconds:', !!loginForm);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-react-loading.png', fullPage: true });
    console.log('Screenshot saved as debug-react-loading.png');
  });
});

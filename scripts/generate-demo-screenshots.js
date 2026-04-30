const puppeteer = require('puppeteer');

// Helper function to wait for element by text content
async function waitForElementByText(page, text, timeout = 10000) {
  try {
    await page.waitForFunction(
      (expectedText) => {
        const body = document.body.textContent || '';
        return body.includes(expectedText);
      },
      { timeout },
      text
    );
    return true;
  } catch (error) {
    console.log(`Element with text "${text}" not found within timeout`);
    return false;
  }
}

// Helper function to click button by text
async function clickButtonByText(page, buttonText) {
  console.log(`Looking for button with text: ${buttonText}`);
  
  const clicked = await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    for (const button of buttons) {
      const btnText = button.textContent?.toLowerCase() || '';
      console.log('Found button:', btnText);
      if (btnText.includes(text.toLowerCase())) {
        button.click();
        return true;
      }
    }
    return false;
  }, buttonText);
  
  if (clicked) {
    console.log(`Clicked button: ${buttonText}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log(`Button not found: ${buttonText}`);
  }
  return clicked;
}

// Helper function to click element by selector
async function clickElement(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  } catch (error) {
    console.log(`Element not found: ${selector}`);
    return false;
  }
}

async function generateAuthenticatedScreenshots() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const baseUrl = 'http://localhost:5177';
    
    console.log('Generating screenshots with real server authentication via API...');
    
    // First, authenticate via API to get a real token
    const fetch = (await import('node-fetch')).default;
    const authResponse = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'screenshot_user', password: 'screenshot123' })
    });
    
    const authData = await authResponse.json();
    console.log('API Authentication successful:', authData.success);
    
    if (!authData.success) {
      throw new Error('API authentication failed');
    }
    
    const { user, token } = authData.data;
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    // Set authentication in localStorage before navigating
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.evaluate((userData, authToken) => {
      localStorage.setItem('race_wars_token', authToken);
      localStorage.setItem('race_wars_user', JSON.stringify(userData));
      localStorage.setItem('race_wars_token_expiry', (Date.now() + 86400000).toString());
    }, user, token);
    
    console.log('Real authentication token set in localStorage');
    
    // Connection Screen
    console.log('Generating Connection screenshot...');
    await page.goto(`${baseUrl}/?view=connection`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ 
      path: 'docs/assets/connection-screen.png',
      fullPage: false 
    });
    console.log('✓ Connection screenshot generated');
    
    // Race Selection
    console.log('Generating Race Selection screenshot...');
    await page.goto(`${baseUrl}/?view=race-selector`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ 
      path: 'docs/assets/race-selection.png',
      fullPage: true 
    });
    console.log('✓ Race selection screenshot generated');
    
    // Race Creation
    console.log('Generating Race Creation screenshot...');
    await page.goto(`${baseUrl}/?view=race-creator`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ 
      path: 'docs/assets/race-creation.png',
      fullPage: false 
    });
    console.log('✓ Race creation screenshot generated');
    
    // Admin Console
    console.log('Generating Admin Console screenshot...');
    await page.goto(`${baseUrl}/?view=admin`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ 
      path: 'docs/assets/admin-console.png',
      fullPage: false 
    });
    console.log('✓ Admin console screenshot generated');
    
    // Mobile screenshots
    console.log('Generating mobile screenshots...');
    await page.setViewport({ width: 375, height: 667 });
    
    // Mobile Race Selection
    console.log('Generating Mobile Race Selection screenshot...');
    await page.goto(`${baseUrl}/?view=race-selector`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ 
      path: 'docs/assets/mobile-race-selection.png',
      fullPage: false 
    });
    console.log('✓ Mobile race selection screenshot generated');
    
    // Full page showcase
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('Generating Full App Showcase screenshot...');
    await page.goto(`${baseUrl}/?view=race-selector`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ 
      path: 'docs/assets/showcase-main.png',
      fullPage: true 
    });
    console.log('✓ Full app showcase screenshot generated');

    console.log('All authenticated screenshots generated successfully!');

  } catch (error) {
    console.error('Error generating screenshots:', error);
  } finally {
    await browser.close();
  }
}

generateAuthenticatedScreenshots();

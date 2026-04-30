const puppeteer = require('puppeteer');

// Real authentication using the login form
async function authenticate(page, username = 'screenshot_user', password = 'screenshot123') {
  console.log(`Authenticating with real server... Username: ${username}`);
  
  // Wait for auth screen to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Clear any existing values
  await page.evaluate(() => {
    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
  });
  
  // Fill in username and password
  const usernameInput = await page.$('input[name="username"]');
  const passwordInput = await page.$('input[name="password"]');
  
  console.log('Username input found:', !!usernameInput);
  console.log('Password input found:', !!passwordInput);
  
  if (usernameInput && passwordInput) {
    await usernameInput.click();
    await usernameInput.type(username, { delay: 50 });
    
    await passwordInput.click();
    await passwordInput.type(password, { delay: 50 });
    
    console.log('Credentials filled, clicking login button...');
    
    // Click login button
    const loginClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const button of buttons) {
        const text = button.textContent?.toLowerCase() || '';
        console.log('Button text:', text);
        if (text.includes('login') || text.includes('sign in')) {
          button.click();
          return true;
        }
      }
      return false;
    });
    
    console.log('Login button clicked:', loginClicked);
    
    if (loginClicked) {
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Check if we're still on auth screen
      const stillOnAuth = await page.evaluate(() => {
        const body = document.body.textContent || '';
        return body.includes('Sign in') || body.includes('Invalid credentials');
      });
      
      if (stillOnAuth) {
        console.log('Still on auth screen, authentication may have failed');
        return false;
      }
      
      console.log('Authentication successful');
      return true;
    }
  }
  
  console.log('Authentication failed - inputs not found');
  return false;
}

// Helper function to click button by text
async function clickButtonByText(page, buttonText) {
  const clicked = await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const button of buttons) {
      const btnText = button.textContent?.toLowerCase() || '';
      if (btnText.includes(text.toLowerCase())) {
        button.click();
        return true;
      }
    }
    return false;
  }, buttonText);
  
  if (clicked) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }
  return false;
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
    
    // Navigate to app and set real authentication token
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Set real authentication in localStorage
    await page.evaluate((userData, authToken) => {
      localStorage.setItem('race_wars_token', authToken);
      localStorage.setItem('race_wars_user', JSON.stringify(userData));
      localStorage.setItem('race_wars_token_expiry', (Date.now() + 86400000).toString());
    }, user, token);
    
    console.log('Real authentication token set in localStorage');
    
    // Navigate to connection screen
    await page.goto(`${baseUrl}/?view=connection`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Connection Screen
    console.log('Generating Connection screenshot...');
    await page.screenshot({ 
      path: 'docs/assets/connection-screen.png',
      fullPage: false 
    });
    console.log('✓ Connection screenshot generated');
    
    // Navigate to race selector
    await page.goto(`${baseUrl}/?view=race-selector`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Race Selection
    console.log('Generating Race Selection screenshot...');
    await page.screenshot({ 
      path: 'docs/assets/race-selection.png',
      fullPage: true 
    });
    console.log('✓ Race selection screenshot generated');
    
    // Race Creation
    console.log('Navigating to Race Creation...');
    await page.goto(`${baseUrl}/?view=race-creator`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Generating Race Creation screenshot...');
    await page.screenshot({ 
      path: 'docs/assets/race-creation.png',
      fullPage: false 
    });
    console.log('✓ Race creation screenshot generated');
    
    // Admin Console
    console.log('Navigating to Admin Console...');
    await page.goto(`${baseUrl}/?view=admin`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Generating Admin Console screenshot...');
    await page.screenshot({ 
      path: 'docs/assets/admin-console.png',
      fullPage: false 
    });
    console.log('✓ Admin console screenshot generated');
    
    // Mobile screenshots
    console.log('Generating mobile screenshots...');
    await page.setViewport({ width: 375, height: 667 });
    
    // Set authentication again for mobile
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.evaluate((userData, authToken) => {
      localStorage.setItem('race_wars_token', authToken);
      localStorage.setItem('race_wars_user', JSON.stringify(userData));
      localStorage.setItem('race_wars_token_expiry', (Date.now() + 86400000).toString());
    }, user, token);
    
    // Navigate to race selector
    await page.goto(`${baseUrl}/?view=race-selector`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Generating Mobile Race Selection screenshot...');
    await page.screenshot({ 
      path: 'docs/assets/mobile-race-selection.png',
      fullPage: false 
    });
    console.log('✓ Mobile race selection screenshot generated');
    
    // Full page showcase
    await page.setViewport({ width: 1200, height: 800 });
    
    // Set authentication again for showcase
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.evaluate((userData, authToken) => {
      localStorage.setItem('race_wars_token', authToken);
      localStorage.setItem('race_wars_user', JSON.stringify(userData));
      localStorage.setItem('race_wars_token_expiry', (Date.now() + 86400000).toString());
    }, user, token);
    
    // Navigate to race selector
    await page.goto(`${baseUrl}/?view=race-selector`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Generating Full App Showcase screenshot...');
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

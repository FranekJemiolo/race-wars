const puppeteer = require('puppeteer');

async function generateShowcaseMainScreenshot() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const baseUrl = 'http://localhost:5177';
    
    console.log('Generating Showcase Main screenshot...');
    
    // Authenticate via API
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
    
    // Set authentication in localStorage
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await page.evaluate((userData, authToken) => {
      localStorage.setItem('race_wars_token', authToken);
      localStorage.setItem('race_wars_user', JSON.stringify(userData));
      localStorage.setItem('race_wars_token_expiry', (Date.now() + 86400000).toString());
    }, user, token);
    
    // Force admin role
    await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('race_wars_user') || '{}');
      user.role = 'admin';
      localStorage.setItem('race_wars_user', JSON.stringify(user));
    });
    
    console.log('Authentication set in localStorage');
    
    // Reload to apply auth and show connection screen
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Generate screenshot of connection screen (showcase)
    console.log('Generating Showcase Main screenshot...');
    await page.screenshot({ 
      path: 'docs/assets/showcase-main.png',
      fullPage: false 
    });
    console.log('✓ Showcase main screenshot generated');

  } catch (error) {
    console.error('Error generating screenshot:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

generateShowcaseMainScreenshot();

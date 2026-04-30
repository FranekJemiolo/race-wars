const puppeteer = require('puppeteer');

async function generateRacingViewScreenshot() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const baseUrl = 'http://localhost:5177';
    
    console.log('Generating Racing View screenshot...');
    
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
    
    // Reload to apply auth
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Navigate to race selection
    console.log('Navigating to Race Selection...');
    const serverClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (const element of elements) {
        const text = element.textContent || '';
        if (text.includes('Local Development') && element.style.cursor === 'pointer') {
          element.click();
          return true;
        }
      }
      return false;
    });
    
    if (!serverClicked) {
      throw new Error('Could not click server card');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Navigate to racing view by clicking a race's join button
    console.log('Navigating to Racing View...');
    const joinClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      for (const button of buttons) {
        const btnText = button.textContent || '';
        if (btnText.includes('Join') || btnText.includes('🏁')) {
          button.click();
          return true;
        }
      }
      return false;
    });
    
    if (!joinClicked) {
      throw new Error('Could not click Join button');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Generate screenshot
    console.log('Generating Racing View screenshot...');
    await page.screenshot({ 
      path: 'docs/assets/racing-view.png',
      fullPage: false 
    });
    console.log('✓ Racing view screenshot generated');

  } catch (error) {
    console.error('Error generating screenshot:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

generateRacingViewScreenshot();

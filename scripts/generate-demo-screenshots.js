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

// Helper function to click button by emoji or text
async function clickButtonByEmojiOrText(page, searchText) {
  console.log(`Looking for button with emoji or text: ${searchText}`);
  
  const clicked = await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    for (const button of buttons) {
      const btnText = button.textContent || '';
      console.log('Found button:', btnText);
      // Check if button contains the search text (case insensitive) or emoji
      if (btnText.toLowerCase().includes(text.toLowerCase()) || btnText.includes('🛠️')) {
        button.click();
        return true;
      }
    }
    return false;
  }, searchText);
  
  if (clicked) {
    console.log(`Clicked button with emoji or text: ${searchText}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log(`Button with emoji or text not found: ${searchText}`);
  }
  return clicked;
}

// Helper function to click button containing specific emoji
async function clickButtonByEmoji(page, emoji) {
  console.log(`Looking for button with emoji: ${emoji}`);
  
  const clicked = await page.evaluate((targetEmoji) => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    for (const button of buttons) {
      const btnText = button.textContent || '';
      console.log('Found button:', btnText);
      if (btnText.includes(targetEmoji)) {
        button.click();
        return true;
      }
    }
    return false;
  }, emoji);
  
  if (clicked) {
    console.log(`Clicked button with emoji: ${emoji}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log(`Button with emoji not found: ${emoji}`);
  }
  return clicked;
}

// Helper function to click server card by name
async function clickServerCard(page, serverName) {
  console.log(`Looking for server card: ${serverName}`);
  
  const clicked = await page.evaluate((name) => {
    const elements = Array.from(document.querySelectorAll('*'));
    for (const element of elements) {
      const text = element.textContent || '';
      if (text.includes(name) && element.style.cursor === 'pointer') {
        element.click();
        return true;
      }
    }
    return false;
  }, serverName);
  
  if (clicked) {
    console.log(`Clicked server card: ${serverName}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log(`Server card not found: ${serverName}`);
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
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for CSS to load
    
    await page.evaluate((userData, authToken) => {
      localStorage.setItem('race_wars_token', authToken);
      localStorage.setItem('race_wars_user', JSON.stringify(userData));
      localStorage.setItem('race_wars_token_expiry', (Date.now() + 86400000).toString());
    }, user, token);
    
    // Force admin role for screenshot generation
    await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('race_wars_user') || '{}');
      user.role = 'admin';
      localStorage.setItem('race_wars_user', JSON.stringify(user));
    });
    
    console.log('Real authentication token set in localStorage');
    
    // Reload page to apply authentication
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for CSS to load
    
    // Connection Screen (default view after auth)
    console.log('Generating Connection screenshot...');
    await page.screenshot({ 
      path: 'docs/assets/connection-screen.png',
      fullPage: false 
    });
    console.log('✓ Connection screenshot generated');
    
    // Navigate to Race Selection by clicking a server card
    console.log('Navigating to Race Selection...');
    const serverClicked = await clickServerCard(page, 'Local Development');
    if (serverClicked) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for CSS to load
      
      console.log('Generating Race Selection screenshot...');
      await page.screenshot({ 
        path: 'docs/assets/race-selection.png',
        fullPage: false 
      });
      console.log('✓ Race selection screenshot generated');
    } else {
      console.log('Could not navigate to race selection, skipping');
    }
    
    // Navigate to Race Creation
    console.log('Navigating to Race Creation...');
    const createRaceClicked = await clickButtonByText(page, 'create race');
    if (createRaceClicked) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for CSS to load
      
      console.log('Generating Race Creation screenshot...');
      await page.screenshot({ 
        path: 'docs/assets/race-creation.png',
        fullPage: false 
      });
      console.log('✓ Race creation screenshot generated');
      
      // Go back to race selection
      await clickButtonByText(page, 'cancel');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('Could not navigate to race creation, skipping');
    }
    
    // Navigate to Admin Console
    console.log('Navigating to Admin Console...');
    const adminClicked = await clickButtonByEmoji(page, '🛠️');
    if (adminClicked) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for CSS to load
      
      console.log('Generating Admin Console screenshot...');
      await page.screenshot({ 
        path: 'docs/assets/admin-console.png',
        fullPage: false 
      });
      console.log('✓ Admin console screenshot generated');
      
      // Go back
      await clickButtonByText(page, 'back');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('Could not navigate to admin console, skipping');
    }
    
    // Mobile screenshots
    console.log('Generating mobile screenshots...');
    await page.setViewport({ width: 375, height: 667 });
    
    // Reload for mobile view
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for CSS to load
    
    // Mobile Race Selection
    console.log('Generating Mobile Race Selection screenshot...');
    await clickServerCard(page, 'Local Development');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for CSS to load
    await page.screenshot({ 
      path: 'docs/assets/mobile-race-selection.png',
      fullPage: false 
    });
    console.log('✓ Mobile race selection screenshot generated');
    
    // Full page showcase - show connection screen with full background
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('Generating Full App Showcase screenshot...');
    await page.goto(baseUrl);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for full CSS to load
    await page.screenshot({ 
      path: 'docs/assets/showcase-main.png',
      fullPage: false 
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

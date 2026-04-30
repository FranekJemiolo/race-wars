const puppeteer = require('puppeteer');

async function generateScreenshots() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Set viewport for desktop screenshots
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Generating mobile team management screenshot...');
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find and click on mobile demo or team interface
    try {
      const mobileButton = await page.$('button:has-text("Mobile"), a:has-text("Mobile")');
      if (mobileButton) {
        await mobileButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log('Mobile button not found, continuing with current view...');
    }

    await page.screenshot({ 
      path: 'docs/assets/mobile-team-management.png',
      fullPage: false 
    });

    console.log('Generating live racing interface screenshot...');
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find racing interface
    try {
      const raceButton = await page.$('button:has-text("Race"), a:has-text("Race")');
      if (raceButton) {
        await raceButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log('Race button not found, continuing with current view...');
    }

    await page.screenshot({ 
      path: 'docs/assets/live-racing-interface.png',
      fullPage: false 
    });

    console.log('Generating race replay system screenshot...');
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find replay interface
    try {
      const replayButton = await page.$('button:has-text("Replay"), a:has-text("Replay")');
      if (replayButton) {
        await replayButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log('Replay button not found, continuing with current view...');
    }

    await page.screenshot({ 
      path: 'docs/assets/race-replay-system.png',
      fullPage: false 
    });

    console.log('Generating admin panel screenshot...');
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find admin interface
    try {
      const adminButton = await page.$('button:has-text("Admin"), a:has-text("Admin")');
      if (adminButton) {
        await adminButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log('Admin button not found, continuing with current view...');
    }

    await page.screenshot({ 
      path: 'docs/assets/admin-panel.png',
      fullPage: false 
    });

    console.log('Generating leaderboard screenshot...');
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find leaderboard
    try {
      const leaderboardButton = await page.$('button:has-text("Leaderboard"), a:has-text("Leaderboard")');
      if (leaderboardButton) {
        await leaderboardButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log('Leaderboard button not found, continuing with current view...');
    }

    await page.screenshot({ 
      path: 'docs/assets/leaderboard.png',
      fullPage: false 
    });

    // Mobile screenshots
    console.log('Generating mobile screenshots...');
    await page.setViewport({ width: 375, height: 667 });

    console.log('Generating mobile racing interface screenshot...');
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ 
      path: 'docs/assets/mobile-racing-interface.png',
      fullPage: false 
    });

    console.log('Generating route builder screenshot...');
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find route builder
    try {
      const routeButton = await page.$('button:has-text("Route"), a:has-text("Route")');
      if (routeButton) {
        await routeButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log('Route button not found, continuing with current view...');
    }

    await page.screenshot({ 
      path: 'docs/assets/route-builder.png',
      fullPage: false 
    });

    console.log('Generating team dashboard screenshot...');
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find team dashboard
    try {
      const teamButton = await page.$('button:has-text("Team"), a:has-text("Team")');
      if (teamButton) {
        await teamButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log('Team button not found, continuing with current view...');
    }

    await page.screenshot({ 
      path: 'docs/assets/team-dashboard.png',
      fullPage: false 
    });

    console.log('Generating comprehensive app showcase screenshot...');
    await page.goto('http://localhost:5177');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ 
      path: 'docs/assets/showcase-main.png',
      fullPage: true 
    });

    console.log('All screenshots generated successfully!');

  } catch (error) {
    console.error('Error generating screenshots:', error);
  } finally {
    await browser.close();
  }
}

generateScreenshots();

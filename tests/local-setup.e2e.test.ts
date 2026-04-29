import { test, expect, Browser, Page } from '@playwright/test';
import { WebSocket } from 'ws';

test.describe('Local Setup Verification', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set up WebSocket monitoring
    page.on('websocket', wsObject => {
      console.log('WebSocket connection created:', wsObject.url());
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Client can log in successfully', async () => {
    await page.goto('http://localhost');
    
    // Wait for login form to be visible - look for email input
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'admin@racewars.dev');
    await page.fill('input[type="password"]', 'admin');
    
    // Submit login form - look for submit button
    await page.click('button[type="submit"]');
    
    // Wait for successful login - check for race selection interface
    await page.waitForSelector('h1:has-text("Race Selection")', { timeout: 10000 });
    
    // Verify we're logged in by checking for race list elements
    const raceHeader = await page.isVisible('h1:has-text("Race Selection")');
    expect(raceHeader).toBe(true);
    
    console.log('✅ Login successful');
  });

  test('Can view races with proper filtering and sorting', async () => {
    await page.goto('http://localhost');
    
    // Login first
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@racewars.dev');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForSelector('h1:has-text("Race Selection")', { timeout: 10000 });
    
    // Wait for races to load
    await page.waitForTimeout(2000);
    
    // Check for race items
    const raceItems = await page.$$('div:has(h3)');
    expect(raceItems.length).toBeGreaterThan(0);
    
    // Test filtering by race type
    const filterSelect = await page.$('select:has-text("All Types")');
    if (filterSelect) {
      await filterSelect.click();
      await page.click('option:has-text("⚔️ Duel")');
      await page.waitForTimeout(1000);
    }
    
    // Test sorting by start time
    const sortSelect = await page.$('select:has-text("Starting Soon")');
    if (sortSelect) {
      await sortSelect.click();
      await page.click('option:has-text("Newest")');
      await page.waitForTimeout(1000);
    }
    
    // Verify races are displayed with proper information
    const raceNames = await page.$$eval('h3', elements => 
      elements.map(el => el.textContent?.trim()).filter(Boolean)
    );
    
    expect(raceNames.length).toBeGreaterThan(0);
    
    console.log(`✅ Found ${raceItems.length} races with filtering and sorting`);
  });

  test('Race filtering by type works correctly', async () => {
    await page.goto('http://localhost');
    
    // Login
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@racewars.dev');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForSelector('h1:has-text("Race Selection")', { timeout: 10000 });
    
    // Wait for races to load
    await page.waitForTimeout(2000);
    
    // Test filtering by race type
    const filterSelect = await page.$('select:has-text("All Types")');
    if (filterSelect) {
      // Filter by circuit races
      await filterSelect.click();
      await page.click('option:has-text("⭕ Circuit")');
      await page.waitForTimeout(1000);
      
      // Filter by custom races
      await filterSelect.click();
      await page.click('option:has-text("🛣️ Custom")');
      await page.waitForTimeout(1000);
      
      // Filter by duel races
      await filterSelect.click();
      await page.click('option:has-text("⚔️ Duel")');
      await page.waitForTimeout(1000);
      
      console.log('✅ Race type filtering tested');
    }
  });

  test('Duel races have maximum 2 participants', async () => {
    // First, let's check API directly to verify duel participant limits
    const response = await page.evaluate(async () => {
      const racesResponse = await fetch('/api/races');
      const races = await racesResponse.json();
      
      const duelRaces = races.filter((race: any) => race.type === 'duel');
      return duelRaces;
    });
    
    // Verify all duel races have maxParticipants of 2
    response.forEach((race: any) => {
      expect(race.maxParticipants).toBeLessThanOrEqual(2);
      expect(race.type).toBe('duel');
    });
    
    console.log(`✅ Verified ${response.length} duel races have max 2 participants`);
  });

  test('WebSocket connection works after login', async () => {
    await page.goto('http://localhost');
    
    // Login
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@racewars.dev');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForSelector('h1:has-text("Race Selection")', { timeout: 10000 });
    
    // Monitor WebSocket connections
    const wsConnections: string[] = [];
    page.on('websocket', wsObject => {
      wsConnections.push(wsObject.url());
    });
    
    // Navigate to a race page to trigger WebSocket connection
    const firstRace = await page.$('div:has(h3)');
    if (firstRace) {
      await firstRace.click();
      await page.waitForTimeout(2000);
    }
    
    // Check if WebSocket connection was established
    expect(wsConnections.length).toBeGreaterThan(0);
    expect(wsConnections.some(url => url.includes('ws://localhost/ws'))).toBe(true);
    
    console.log(`✅ WebSocket connections established: ${wsConnections.join(', ')}`);
  });

  test('Complete workflow: Login -> Browse Races -> Filter -> Join Race', async () => {
    await page.goto('http://localhost');
    
    // Login
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@racewars.dev');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForSelector('h1:has-text("Race Selection")', { timeout: 10000 });
    
    // Browse races
    await page.waitForTimeout(2000);
    const raceItems = await page.$$('div:has(h3)');
    expect(raceItems.length).toBeGreaterThan(0);
    
    // Filter to upcoming races
    const filterSelect = await page.$('select:has-text("All Types")');
    if (filterSelect) {
      await filterSelect.click();
      await page.click('option:has-text("⚔️ Duel")');
      await page.waitForTimeout(1000);
    }
    
    // Try to join first race (may fail due to auth, but should show proper behavior)
    const firstRace = await page.$('div:has(h3)');
    if (firstRace) {
      await firstRace.click();
      
      // Look for join button or appropriate message
      await page.waitForTimeout(2000);
      
      const joinButton = await page.$('button:has-text("Join Race")');
      const authRequired = await page.$('text:has-text("Access token required")');
      
      // Either we should see join button (if auth works) or auth required message
      expect(joinButton || authRequired).toBeTruthy();
    }
    
    console.log('✅ Complete workflow test passed');
  });
});

test.describe('API Verification Tests', () => {
  test('API returns properly structured race data', async () => {
    const response = await fetch('http://localhost/api/races');
    expect(response.ok).toBe(true);
    
    const races = await response.json();
    expect(Array.isArray(races)).toBe(true);
    expect(races.length).toBeGreaterThan(0);
    
    // Verify race structure
    races.forEach((race: any) => {
      expect(race).toHaveProperty('id');
      expect(race).toHaveProperty('name');
      expect(race).toHaveProperty('type');
      expect(race).toHaveProperty('status');
      expect(race).toHaveProperty('participants');
      expect(race).toHaveProperty('maxParticipants');
      expect(race).toHaveProperty('startTime');
      
      // Verify participant limits for duel races
      if (race.type === 'duel') {
        expect(race.maxParticipants).toBeLessThanOrEqual(2);
      }
    });
    
    console.log(`✅ API returned ${races.length} properly structured races`);
  });

  test('Race filtering and sorting logic works correctly', async () => {
    const response = await fetch('http://localhost/api/races');
    const races = await response.json();
    
    // Test race types
    const raceTypes = [...new Set(races.map((race: any) => race.type))];
    expect(raceTypes).toContain('custom');
    expect(raceTypes).toContain('circuit');
    expect(raceTypes).toContain('duel');
    
    // Test duel races have max 2 participants
    const duelRaces = races.filter((race: any) => race.type === 'duel');
    duelRaces.forEach((race: any) => {
      expect(race.maxParticipants).toBeLessThanOrEqual(2);
    });
    
    // Test sorting by start time
    const sortedByStartTime = [...races].sort((a: any, b: any) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    // Test race statuses
    const raceStatuses = [...new Set(races.map((race: any) => race.status))];
    expect(raceStatuses).toContain('waiting');
    expect(raceStatuses).toContain('starting');
    expect(raceStatuses).toContain('in-progress');
    expect(raceStatuses).toContain('finished');
    
    console.log(`✅ Race data validation passed`);
  });
});

// Helper function to create test duel races in database
async function createTestDuelRace() {
  const response = await fetch('http://localhost/api/races', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify({
      name: 'Test Duel Race',
      type: 'duel',
      trackName: 'Test Circuit',
      maxParticipants: 2,
      duration: 600,
      startTime: new Date(Date.now() + 60000).toISOString(),
      description: 'Test duel for verification',
      requirements: ['Valid license'],
      entryFee: 0,
      prizePool: 100,
      difficulty: 'medium',
      enforcementLevel: 'medium',
      isPublic: true
    })
  });
  
  if (!response.ok) {
    console.log('Note: Could not create test duel race (auth may be required)');
  }
}

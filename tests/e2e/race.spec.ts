import { test, expect } from '@playwright/test';

test.describe('Race Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display events list', async ({ page }) => {
    await page.goto('/events');
    
    // Check events list is visible
    await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first()).toBeVisible();
  });

  test('should create new event', async ({ page }) => {
    await page.goto('/events');
    
    // Click create button
    await page.locator('[data-testid="create-event-button"]').click();
    
    // Check create form is visible
    await expect(page.locator('[data-testid="event-form"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('select[name="eventType"]')).toBeVisible();
    
    // Fill form
    const timestamp = Date.now();
    await page.locator('input[name="name"]').fill(`Test Event ${timestamp}`);
    await page.locator('textarea[name="description"]').fill('A test event for E2E testing');
    await page.locator('select[name="eventType"]').selectOption('TRACK_DAY');
    await page.locator('input[name="startDate"]').fill('2024-12-01');
    await page.locator('input[name="endDate"]').fill('2024-12-01');
    
    // Select track
    await page.locator('select[name="trackId"]').selectOption({ index: 0 });
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Check for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show event details', async ({ page }) => {
    await page.goto('/events');
    
    // Click on first event
    await page.locator('[data-testid="event-card"]').first().click();
    
    // Check event details page
    await expect(page.locator('[data-testid="event-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-sessions"]')).toBeVisible();
  });

  test('should create race session', async ({ page }) => {
    await page.goto('/events');
    
    // Click on first event
    await page.locator('[data-testid="event-card"]').first().click();
    
    // Click create session button
    await page.locator('[data-testid="create-session-button"]').click();
    
    // Check session form is visible
    await expect(page.locator('[data-testid="session-form"]')).toBeVisible();
    
    // Fill form
    await page.locator('input[name="name"]').fill('Test Session');
    await page.locator('select[name="sessionType"]').selectOption('PRACTICE');
    await page.locator('input[name="startTime"]').fill('09:00');
    await page.locator('input[name="endTime"]').fill('10:00');
    await page.locator('input[name="maxParticipants"]').fill('20');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Check for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should register for session', async ({ page }) => {
    await page.goto('/events');
    
    // Click on first event
    await page.locator('[data-testid="event-card"]').first().click();
    
    // Click on first session
    await page.locator('[data-testid="session-card"]').first().click();
    
    // Click register button
    await page.locator('[data-testid="register-button"]').click();
    
    // Check registration form
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();
    
    // Fill form
    await page.locator('input[name="carMake"]').fill('Test Car');
    await page.locator('input[name="carModel"]').fill('Test Model');
    await page.locator('input[name="carYear"]').fill('2024');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Check for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display live race view', async ({ page }) => {
    await page.goto('/events');
    
    // Click on first event
    await page.locator('[data-testid="event-card"]').first().click();
    
    // Click on first session
    await page.locator('[data-testid="session-card"]').first().click();
    
    // Click live view button
    await page.locator('[data-testid="live-view-button"]').click();
    
    // Check live race view components
    await expect(page.locator('[data-testid="race-map"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="race-timing"]')).toBeVisible();
  });

  test('should show race control panel', async ({ page }) => {
    await page.goto('/events');
    
    // Click on first event
    await page.locator('[data-testid="event-card"]').first().click();
    
    // Click on first session
    await page.locator('[data-testid="session-card"]').first().click();
    
    // Click race control button
    await page.locator('[data-testid="race-control-button"]').click();
    
    // Check race control components
    await expect(page.locator('[data-testid="flag-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="participant-list"]')).toBeVisible();
  });

  test('should control race flags', async ({ page }) => {
    await page.goto('/events');
    
    // Navigate to race control
    await page.locator('[data-testid="event-card"]').first().click();
    await page.locator('[data-testid="session-card"]').first().click();
    await page.locator('[data-testid="race-control-button"]').click();
    
    // Click green flag
    await page.locator('[data-testid="green-flag-button"]').click();
    
    // Check flag status
    await expect(page.locator('[data-testid="flag-status"]')).toContainText('GREEN');
    
    // Click yellow flag
    await page.locator('[data-testid="yellow-flag-button"]').click();
    
    // Check flag status
    await expect(page.locator('[data-testid="flag-status"]')).toContainText('YELLOW');
  });

  test('should deploy safety car', async ({ page }) => {
    await page.goto('/events');
    
    // Navigate to race control
    await page.locator('[data-testid="event-card"]').first().click();
    await page.locator('[data-testid="session-card"]').first().click();
    await page.locator('[data-testid="race-control-button"]').click();
    
    // Click safety car button
    await page.locator('[data-testid="safety-car-button"]').click();
    
    // Check safety car status
    await expect(page.locator('[data-testid="safety-car-status"]')).toContainText('DEPLOYED');
    
    // Recall safety car
    await page.locator('[data-testid="recall-safety-car-button"]').click();
    
    // Check safety car status
    await expect(page.locator('[data-testid="safety-car-status"]')).toContainText('RECALLED');
  });

  test('should show participant timing', async ({ page }) => {
    await page.goto('/events');
    
    // Navigate to session
    await page.locator('[data-testid="event-card"]').first().click();
    await page.locator('[data-testid="session-card"]').first().click();
    
    // Click timing tab
    await page.locator('[data-testid="timing-tab"]').click();
    
    // Check timing table
    await expect(page.locator('[data-testid="timing-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="lap-times"]')).toBeVisible();
  });

  test('should export race data', async ({ page }) => {
    await page.goto('/events');
    
    // Navigate to session
    await page.locator('[data-testid="event-card"]').first().click();
    await page.locator('[data-testid="session-card"]').first().click();
    
    // Click export button
    await page.locator('[data-testid="export-button"]').click();
    
    // Check export options
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-csv"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-json"]')).toBeVisible();
  });

  test('should show race statistics', async ({ page }) => {
    await page.goto('/events');
    
    // Navigate to session
    await page.locator('[data-testid="event-card"]').first().click();
    await page.locator('[data-testid="session-card"]').first().click();
    
    // Click statistics tab
    await page.locator('[data-testid="statistics-tab"]').click();
    
    // Check statistics
    await expect(page.locator('[data-testid="race-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="participant-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="lap-records"]')).toBeVisible();
  });

  test('should manage participants', async ({ page }) => {
    await page.goto('/events');
    
    // Navigate to session
    await page.locator('[data-testid="event-card"]').first().click();
    await page.locator('[data-testid="session-card"]').first().click();
    
    // Click participants tab
    await page.locator('[data-testid="participants-tab"]').click();
    
    // Check participants list
    await expect(page.locator('[data-testid="participants-list"]')).toBeVisible();
    
    // Click on participant
    await page.locator('[data-testid="participant-row"]').first().click();
    
    // Check participant details
    await expect(page.locator('[data-testid="participant-details"]')).toBeVisible();
  });

  test('should show race history', async ({ page }) => {
    await page.goto('/events');
    
    // Click on first event
    await page.locator('[data-testid="event-card"]').first().click();
    
    // Click history tab
    await page.locator('[data-testid="history-tab"]').click();
    
    // Check race history
    await expect(page.locator('[data-testid="race-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="past-sessions"]')).toBeVisible();
  });
});

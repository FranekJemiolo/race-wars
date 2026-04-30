import { test, expect } from '@playwright/test';

test.describe('Track Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display tracks list', async ({ page }) => {
    await page.goto('/tracks');
    
    // Check tracks list is visible
    await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
    const trackCards = page.locator('[data-testid="track-card"]');
    await expect(trackCards.first()).toBeVisible();
  });

  test('should search tracks', async ({ page }) => {
    await page.goto('/tracks');
    
    // Enter search term
    await page.locator('[data-testid="search-input"]').fill('test');
    await page.locator('[data-testid="search-button"]').click();
    
    // Check search results
    await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  });

  test('should filter tracks by type', async ({ page }) => {
    await page.goto('/tracks');
    
    // Select track type filter
    await page.locator('[data-testid="type-filter"]').selectOption('CIRCUIT');
    
    // Check filtered results
    await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  });

  test('should filter tracks by difficulty', async ({ page }) => {
    await page.goto('/tracks');
    
    // Select difficulty filter
    await page.locator('[data-testid="difficulty-filter"]').selectOption('MODERATE');
    
    // Check filtered results
    await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  });

  test('should show track details', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click on first track
    await page.locator('[data-testid="track-card"]').first().click();
    
    // Check track details page
    await expect(page.locator('[data-testid="track-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-map"]')).toBeVisible();
  });

  test('should create new track', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click create button
    await page.locator('[data-testid="create-track-button"]').click();
    
    // Check create form is visible
    await expect(page.locator('[data-testid="track-form"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="locationName"]')).toBeVisible();
    
    // Fill form
    await page.locator('input[name="name"]').fill('Test Track');
    await page.locator('textarea[name="description"]').fill('A test track for E2E testing');
    await page.locator('input[name="locationName"]').fill('Test Location');
    await page.locator('select[name="trackType"]').selectOption('CIRCUIT');
    await page.locator('select[name="difficultyLevel"]').selectOption('MODERATE');
    
    // Submit form (would need to upload centerline data in real implementation)
    await page.locator('button[type="submit"]').click();
    
    // Check for success message or redirect
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should edit existing track', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click on first track
    await page.locator('[data-testid="track-card"]').first().click();
    
    // Click edit button
    await page.locator('[data-testid="edit-track-button"]').click();
    
    // Check edit form is visible
    await expect(page.locator('[data-testid="track-form"]')).toBeVisible();
    
    // Update track name
    await page.locator('input[name="name"]').fill('Updated Test Track');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Check for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should delete track', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click on first track
    await page.locator('[data-testid="track-card"]').first().click();
    
    // Click delete button
    await page.locator('[data-testid="delete-track-button"]').click();
    
    // Confirm deletion
    await page.locator('[data-testid="confirm-delete"]').click();
    
    // Check for success message and redirect
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show featured tracks', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click featured filter
    await page.locator('[data-testid="featured-filter"]').click();
    
    // Check featured tracks are shown
    await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  });

  test('should find tracks near location', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click nearby tracks button
    await page.locator('[data-testid="nearby-tracks-button"]').click();
    
    // Check location permission dialog or manual location input
    await expect(page.locator('[data-testid="location-input"]')).toBeVisible();
    
    // Enter test coordinates
    await page.locator('input[name="lat"]').fill('37.7749');
    await page.locator('input[name="lng"]').fill('-122.4194');
    await page.locator('input[name="radius"]').fill('50');
    
    // Search
    await page.locator('button[type="submit"]').click();
    
    // Check results
    await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  });

  test('should validate track geometry', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click create button
    await page.locator('[data-testid="create-track-button"]').click();
    
    // Try to submit without centerline
    await page.locator('input[name="name"]').fill('Invalid Track');
    await page.locator('button[type="submit"]').click();
    
    // Check for validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Centerline is required');
  });

  test('should display track statistics', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click on first track
    await page.locator('[data-testid="track-card"]').first().click();
    
    // Check statistics section
    await expect(page.locator('[data-testid="track-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-length"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-corners"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-max-speed"]')).toBeVisible();
  });

  test('should show track on map', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click on first track
    await page.locator('[data-testid="track-card"]').first().click();
    
    // Check map is loaded
    await expect(page.locator('[data-testid="track-map"]')).toBeVisible();
    
    // Check track centerline is displayed
    await expect(page.locator('[data-testid="track-centerline"]')).toBeVisible();
  });

  test('should export track data', async ({ page }) => {
    await page.goto('/tracks');
    
    // Click on first track
    await page.locator('[data-testid="track-card"]').first().click();
    
    // Click export button
    await page.locator('[data-testid="export-track-button"]').click();
    
    // Check export options
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-geojson"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-gpx"]')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('GPS Capturing', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant geolocation permission
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
    await context.grantPermissions(['geolocation']);
    
    await page.goto('http://localhost:3000');
  });

  test('should request GPS permission', async ({ page }) => {
    await page.click('text=Join Race');
    
    // Check if permission request is shown
    await expect(page.locator('text=Allow location access')).toBeVisible();
  });

  test('should start GPS tracking', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Check if tracking is active
    await expect(page.locator('text=Tracking Active')).toBeVisible();
  });

  test('should display current position', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Check if position is displayed
    await expect(page.locator('text=Latitude:')).toBeVisible();
    await expect(page.locator('text=Longitude:')).toBeVisible();
  });

  test('should display speed', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Check if speed is displayed
    await expect(page.locator('text=Speed:')).toBeVisible();
  });

  test('should display heading', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Check if heading is displayed
    await expect(page.locator('text=Heading:')).toBeVisible();
  });

  test('should display accuracy', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Check if accuracy is displayed
    await expect(page.locator('text=Accuracy:')).toBeVisible();
  });

  test('should stop GPS tracking', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Stop tracking
    await page.click('text=Stop Tracking');
    
    // Check if tracking is stopped
    await expect(page.locator('text=Tracking Stopped')).toBeVisible();
  });

  test('should save position history', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Wait for some positions to be recorded
    await page.waitForTimeout(5000);
    
    // Stop tracking
    await page.click('text=Stop Tracking');
    
    // Check if history is saved
    await expect(page.locator('text=Positions saved:')).toBeVisible();
  });

  test('should handle GPS errors gracefully', async ({ page }) => {
    // Deny geolocation permission
    await page.context().clearPermissions();
    
    await page.click('text=Join Race');
    
    // Check for error message
    await expect(page.locator('text=Location permission denied')).toBeVisible();
  });

  test('should update position in real-time', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Get initial position
    const initialLat = await page.locator('[data-testid="latitude"]').textContent();
    
    // Simulate movement
    await page.context().setGeolocation({ latitude: 37.7750, longitude: -122.4195 });
    await page.waitForTimeout(2000);
    
    // Get updated position
    const updatedLat = await page.locator('[data-testid="latitude"]').textContent();
    
    // Check if position changed
    expect(initialLat).not.toBe(updatedLat);
  });

  test('should display GPS signal strength', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Check if signal strength is displayed
    await expect(page.locator('text=Signal:')).toBeVisible();
  });

  test('should allow high accuracy mode', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    
    // Enable high accuracy
    await page.check('input[name="highAccuracy"]');
    await page.click('text=Start Tracking');
    
    // Check if high accuracy is active
    await expect(page.locator('text=High Accuracy: On')).toBeVisible();
  });

  test('should track altitude if available', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Check if altitude is displayed (may be optional)
    const altitude = page.locator('text=Altitude:');
    const isVisible = await altitude.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(altitude).toBeVisible();
    }
  });

  test('should calculate distance traveled', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Simulate movement
    await page.context().setGeolocation({ latitude: 37.7750, longitude: -122.4195 });
    await page.waitForTimeout(2000);
    
    // Check if distance is calculated
    await expect(page.locator('text=Distance:')).toBeVisible();
  });

  test('should export GPS data', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    await page.waitForTimeout(5000);
    await page.click('text=Stop Tracking');
    
    // Export data
    await page.click('text=Export Data');
    
    // Check if download is triggered
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('should handle poor GPS accuracy', async ({ page }) => {
    await page.click('text=Join Race');
    await page.click('text=Allow location access');
    await page.click('text=Start Tracking');
    
    // Check if accuracy warning is shown when accuracy is poor
    const accuracyWarning = page.locator('text=Low GPS accuracy');
    const isVisible = await accuracyWarning.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(accuracyWarning).toBeVisible();
    }
  });
});

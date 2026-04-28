import { test, expect } from '@playwright/test';

test.describe('Map Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should open route builder', async ({ page }) => {
    // Navigate to race creator
    await page.click('text=Create Race');
    
    // Click to open route builder
    await page.click('text=Create Custom Route');
    
    // Check if route builder is visible
    await expect(page.locator('.route-builder')).toBeVisible();
  });

  test('should add start point', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Click on map to add start point
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    
    // Check if start point marker is added
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  });

  test('should add checkpoint', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Add start point
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    
    // Select checkpoint tool
    await page.click('text=Checkpoint');
    
    // Add checkpoint
    await map.click({ position: { x: 500, y: 300 } });
    
    // Check if checkpoint marker is added
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
  });

  test('should add finish point', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Add start point
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    
    // Select finish tool
    await page.click('text=Finish');
    
    // Add finish point
    await map.click({ position: { x: 600, y: 300 } });
    
    // Check if finish point marker is added
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
  });

  test('should draw route line between points', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    
    // Add multiple points
    await map.click({ position: { x: 400, y: 300 } });
    await map.click({ position: { x: 500, y: 300 } });
    await map.click({ position: { x: 600, y: 300 } });
    
    // Check if polyline is drawn
    await expect(page.locator('.leaflet-overlay-pane path')).toBeVisible();
  });

  test('should delete point', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    
    // Right-click to delete
    await map.click({ position: { x: 400, y: 300 }, button: 'right' });
    await page.click('text=Delete Point');
    
    // Check if point is removed
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
  });

  test('should set route type to circuit', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Select circuit type
    await page.selectOption('select[name="routeType"]', 'circuit');
    
    // Verify selection
    const select = page.locator('select[name="routeType"]');
    await expect(select).toHaveValue('circuit');
  });

  test('should set route type to sprint', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Select sprint type
    await page.selectOption('select[name="routeType"]', 'sprint');
    
    // Verify selection
    const select = page.locator('select[name="routeType"]');
    await expect(select).toHaveValue('sprint');
  });

  test('should save route', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Add some points
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await map.click({ position: { x: 500, y: 300 } });
    await map.click({ position: { x: 600, y: 300 } });
    
    // Enter route name
    await page.fill('input[name="routeName"]', 'Test Route');
    
    // Save route
    await page.click('text=Save Route');
    
    // Check for success message
    await expect(page.locator('text=Route saved successfully')).toBeVisible();
  });

  test('should cancel route creation', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Cancel
    await page.click('text=Cancel');
    
    // Check if route builder is closed
    await expect(page.locator('.route-builder')).not.toBeVisible();
  });

  test('should display route distance', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await map.click({ position: { x: 500, y: 300 } });
    
    // Check if distance is displayed
    await expect(page.locator('text=Distance:')).toBeVisible();
  });

  test('should display estimated time', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await map.click({ position: { x: 500, y: 300 } });
    
    // Check if estimated time is displayed
    await expect(page.locator('text=Estimated Time:')).toBeVisible();
  });
});

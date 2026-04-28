import { test, expect } from '@playwright/test';

test.describe('Checkpoint Setting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should add checkpoint with custom radius', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Add start point
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    
    // Select checkpoint tool
    await page.locator('button:has-text("Checkpoint")').click();
    
    // Set custom radius
    await page.fill('input[name="checkpointRadius"]', '50');
    
    // Add checkpoint
    await map.click({ position: { x: 500, y: 300 } });
    
    // Check if checkpoint is added with radius
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
  });

  test('should reorder checkpoints', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    
    // Add multiple checkpoints
    await map.click({ position: { x: 400, y: 300 } });
    await page.locator('button:has-text("Checkpoint")').click();
    await map.click({ position: { x: 450, y: 300 } });
    await map.click({ position: { x: 500, y: 300 } });
    await map.click({ position: { x: 550, y: 300 } });
    
    // Drag to reorder
    const checkpoint3 = page.locator('.checkpoint-marker').nth(2);
    await checkpoint3.dragTo(page.locator('.checkpoint-marker').first());
    
    // Verify order changed
    const order = await page.locator('.checkpoint-order').allTextContents();
    expect(order[0]).toBe('3');
  });

  test('should delete checkpoint', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await page.locator('button:has-text("Checkpoint")').click();
    await map.click({ position: { x: 500, y: 300 } });
    
    // Right-click checkpoint to delete
    await page.locator('.checkpoint-marker').click({ button: 'right' });
    await page.locator('text=Delete Checkpoint').click();
    
    // Check if checkpoint is removed
    await expect(page.locator('.checkpoint-marker')).toHaveCount(0);
  });

  test('should set checkpoint as mandatory', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await page.locator('button:has-text("Checkpoint")').click();
    await map.click({ position: { x: 500, y: 300 } });
    
    // Set as mandatory
    await page.check('input[name="mandatoryCheckpoint"]');
    
    // Verify mandatory flag
    const isMandatory = await page.isChecked('input[name="mandatoryCheckpoint"]');
    expect(isMandatory).toBe(true);
  });

  test('should set checkpoint as optional', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await page.locator('button:has-text("Checkpoint")').click();
    await map.click({ position: { x: 500, y: 300 } });
    
    // Uncheck mandatory (optional)
    await page.uncheck('input[name="mandatoryCheckpoint"]');
    
    // Verify optional flag
    const isMandatory = await page.isChecked('input[name="mandatoryCheckpoint"]');
    expect(isMandatory).toBe(false);
  });

  test('should display checkpoint count', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await page.locator('button:has-text("Checkpoint")').click();
    await map.click({ position: { x: 500, y: 300 } });
    await map.click({ position: { x: 600, y: 300 } });
    
    // Check checkpoint count display
    await expect(page.locator('text=Checkpoints: 2')).toBeVisible();
  });

  test('should validate minimum checkpoints', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    // Add only start point
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    
    // Try to save without checkpoints
    await page.click('text=Save Route');
    
    // Check for validation error
    await expect(page.locator('text=At least 1 checkpoint required')).toBeVisible();
  });

  test('should duplicate checkpoint', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await page.locator('button:has-text("Checkpoint")').click();
    await map.click({ position: { x: 500, y: 300 } });
    
    // Right-click to duplicate
    await page.locator('.checkpoint-marker').click({ button: 'right' });
    await page.locator('text=Duplicate Checkpoint').click();
    
    // Check if checkpoint is duplicated
    await expect(page.locator('.checkpoint-marker')).toHaveCount(2);
  });

  test('should set checkpoint time limit', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await page.locator('button:has-text("Checkpoint")').click();
    await map.click({ position: { x: 500, y: 300 } });
    
    // Set time limit
    await page.fill('input[name="timeLimit"]', '30');
    
    // Verify time limit is set
    const timeLimit = await page.inputValue('input[name="timeLimit"]');
    expect(timeLimit).toBe('30');
  });

  test('should display checkpoint sequence number', async ({ page }) => {
    await page.click('text=Create Race');
    await page.click('text=Create Custom Route');
    
    const map = page.locator('.leaflet-container');
    await map.click({ position: { x: 400, y: 300 } });
    await page.locator('button:has-text("Checkpoint")').click();
    await map.click({ position: { x: 500, y: 300 } });
    await map.click({ position: { x: 600, y: 300 } });
    
    // Check sequence numbers on markers
    const markers = page.locator('.checkpoint-marker');
    await expect(markers.nth(0)).toContainText('1');
    await expect(markers.nth(1)).toContainText('2');
  });
});

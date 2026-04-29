import { test, expect } from '@playwright/test';

test.describe('Client Rendering', () => {
  test('should load the application with correct title', async ({ page }) => {
    await page.goto('http://localhost:5174');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle('Race Wars');
  });

  test('should have root element', async ({ page }) => {
    await page.goto('http://localhost:5174');
    
    // Check for root element
    const root = page.locator('#root');
    await expect(root).toBeAttached();
  });

  test('should render React app', async ({ page }) => {
    await page.goto('http://localhost:5174');
    
    // Check that React has rendered something
    const root = page.locator('#root');
    const childCount = await root.evaluate(el => el.childElementCount);
    expect(childCount).toBeGreaterThan(0);
  });

  test('should have proper HTML structure', async ({ page }) => {
    await page.goto('http://localhost:5174');
    
    // Check for proper HTML structure
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    
    const head = page.locator('head');
    await expect(head).toBeAttached();
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should load CSS styles', async ({ page }) => {
    await page.goto('http://localhost:5174');
    
    // In Vite, CSS is loaded via JS modules, so check for any style elements
    const styles = await page.locator('style, link[rel="stylesheet"]').count();
    expect(styles).toBeGreaterThan(0);
  });

  test('should load JavaScript modules', async ({ page }) => {
    await page.goto('http://localhost:5174');
    
    // Check that scripts are loaded
    const scripts = await page.locator('script[type="module"]').count();
    expect(scripts).toBeGreaterThan(0);
  });
});

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rendering.spec.ts >> Client Rendering >> should display the loading screen when disconnected
- Location: e2e/rendering.spec.ts:19:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Race Wars')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Race Wars')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Client Rendering', () => {
  4  |   test('should load the application', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     
  7  |     // Check that the page title is correct
  8  |     await expect(page).toHaveTitle('Race Wars');
  9  |   });
  10 | 
  11 |   test('should display the map container', async ({ page }) => {
  12 |     await page.goto('/');
  13 |     
  14 |     // Wait for the map container to be present
  15 |     const mapContainer = page.locator('#map');
  16 |     await expect(mapContainer).toBeVisible();
  17 |   });
  18 | 
  19 |   test('should display the loading screen when disconnected', async ({ page }) => {
  20 |     await page.goto('/');
  21 |     
  22 |     // Wait for the loading screen
  23 |     const loadingScreen = page.locator('text=Race Wars');
> 24 |     await expect(loadingScreen).toBeVisible();
     |                                 ^ Error: expect(locator).toBeVisible() failed
  25 |     
  26 |     // Check for the subtitle
  27 |     const subtitle = page.locator('text=Real-time GPS Racing Engine');
  28 |     await expect(subtitle).toBeVisible();
  29 |   });
  30 | 
  31 |   test('should display connection indicator', async ({ page }) => {
  32 |     await page.goto('/');
  33 |     
  34 |     // Wait for connection indicator
  35 |     const connectionIndicator = page.locator('text=Disconnected');
  36 |     await expect(connectionIndicator).toBeVisible();
  37 |   });
  38 | 
  39 |   test('should have full-screen layout', async ({ page }) => {
  40 |     await page.goto('/');
  41 |     
  42 |     // Check that the body has full height
  43 |     const body = page.locator('body');
  44 |     const bodyBox = await body.boundingBox();
  45 |     expect(bodyBox?.height).toBeGreaterThan(500);
  46 |   });
  47 | 
  48 |   test('should load Leaflet CSS', async ({ page }) => {
  49 |     await page.goto('/');
  50 |     
  51 |     // Check for Leaflet CSS being loaded
  52 |     const linkElements = await page.locator('link[rel="stylesheet"]').all();
  53 |     let leafletCssLoaded = false;
  54 |     
  55 |     for (const link of linkElements) {
  56 |       const href = await link.getAttribute('href');
  57 |       if (href?.includes('leaflet')) {
  58 |         leafletCssLoaded = true;
  59 |         break;
  60 |       }
  61 |     }
  62 |     
  63 |     expect(leafletCssLoaded).toBe(true);
  64 |   });
  65 | });
  66 | 
```
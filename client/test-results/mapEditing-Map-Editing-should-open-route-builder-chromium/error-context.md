# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mapEditing.spec.ts >> Map Editing >> should open route builder
- Location: e2e/mapEditing.spec.ts:8:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Create Race')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "TracePlay Image Converter" [level=1] [ref=e4]
      - paragraph [ref=e5]: Convert any image into coloring pages or connect-the-dots activities
      - generic [ref=e6]:
        - heading "Convert Images to Coloring Pages" [level=2] [ref=e7]
        - generic [ref=e8]:
          - paragraph [ref=e9]:
            - strong [ref=e10]: "Demo Mode:"
            - text: This is a frontend-only demo with browser-based OpenCV.js.
          - paragraph [ref=e11]: "OpenCV.js Status: ✓ Ready"
        - img "Sample image for conversion" [ref=e13]
        - generic [ref=e14]:
          - button "Load Sample Image" [ref=e15] [cursor=pointer]
          - generic [ref=e16] [cursor=pointer]: Upload Image
  - alert [ref=e17]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Map Editing', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('http://localhost:3000');
  6   |   });
  7   | 
  8   |   test('should open route builder', async ({ page }) => {
  9   |     // Navigate to race creator
> 10  |     await page.click('text=Create Race');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  11  |     
  12  |     // Click to open route builder
  13  |     await page.click('text=Create Custom Route');
  14  |     
  15  |     // Check if route builder is visible
  16  |     await expect(page.locator('.route-builder')).toBeVisible();
  17  |   });
  18  | 
  19  |   test('should add start point', async ({ page }) => {
  20  |     await page.click('text=Create Race');
  21  |     await page.click('text=Create Custom Route');
  22  |     
  23  |     // Click on map to add start point
  24  |     const map = page.locator('.leaflet-container');
  25  |     await map.click({ position: { x: 400, y: 300 } });
  26  |     
  27  |     // Check if start point marker is added
  28  |     await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  29  |   });
  30  | 
  31  |   test('should add checkpoint', async ({ page }) => {
  32  |     await page.click('text=Create Race');
  33  |     await page.click('text=Create Custom Route');
  34  |     
  35  |     // Add start point
  36  |     const map = page.locator('.leaflet-container');
  37  |     await map.click({ position: { x: 400, y: 300 } });
  38  |     
  39  |     // Select checkpoint tool
  40  |     await page.click('text=Checkpoint');
  41  |     
  42  |     // Add checkpoint
  43  |     await map.click({ position: { x: 500, y: 300 } });
  44  |     
  45  |     // Check if checkpoint marker is added
  46  |     await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
  47  |   });
  48  | 
  49  |   test('should add finish point', async ({ page }) => {
  50  |     await page.click('text=Create Race');
  51  |     await page.click('text=Create Custom Route');
  52  |     
  53  |     // Add start point
  54  |     const map = page.locator('.leaflet-container');
  55  |     await map.click({ position: { x: 400, y: 300 } });
  56  |     
  57  |     // Select finish tool
  58  |     await page.click('text=Finish');
  59  |     
  60  |     // Add finish point
  61  |     await map.click({ position: { x: 600, y: 300 } });
  62  |     
  63  |     // Check if finish point marker is added
  64  |     await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
  65  |   });
  66  | 
  67  |   test('should draw route line between points', async ({ page }) => {
  68  |     await page.click('text=Create Race');
  69  |     await page.click('text=Create Custom Route');
  70  |     
  71  |     const map = page.locator('.leaflet-container');
  72  |     
  73  |     // Add multiple points
  74  |     await map.click({ position: { x: 400, y: 300 } });
  75  |     await map.click({ position: { x: 500, y: 300 } });
  76  |     await map.click({ position: { x: 600, y: 300 } });
  77  |     
  78  |     // Check if polyline is drawn
  79  |     await expect(page.locator('.leaflet-overlay-pane path')).toBeVisible();
  80  |   });
  81  | 
  82  |   test('should delete point', async ({ page }) => {
  83  |     await page.click('text=Create Race');
  84  |     await page.click('text=Create Custom Route');
  85  |     
  86  |     const map = page.locator('.leaflet-container');
  87  |     await map.click({ position: { x: 400, y: 300 } });
  88  |     
  89  |     // Right-click to delete
  90  |     await map.click({ position: { x: 400, y: 300 }, button: 'right' });
  91  |     await page.click('text=Delete Point');
  92  |     
  93  |     // Check if point is removed
  94  |     await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
  95  |   });
  96  | 
  97  |   test('should set route type to circuit', async ({ page }) => {
  98  |     await page.click('text=Create Race');
  99  |     await page.click('text=Create Custom Route');
  100 |     
  101 |     // Select circuit type
  102 |     await page.selectOption('select[name="routeType"]', 'circuit');
  103 |     
  104 |     // Verify selection
  105 |     const select = page.locator('select[name="routeType"]');
  106 |     await expect(select).toHaveValue('circuit');
  107 |   });
  108 | 
  109 |   test('should set route type to sprint', async ({ page }) => {
  110 |     await page.click('text=Create Race');
```
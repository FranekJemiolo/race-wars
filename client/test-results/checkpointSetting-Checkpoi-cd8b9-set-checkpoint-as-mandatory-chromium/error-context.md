# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkpointSetting.spec.ts >> Checkpoint Setting >> should set checkpoint as mandatory
- Location: e2e/checkpointSetting.spec.ts:68:7

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
  3   | test.describe('Checkpoint Setting', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('http://localhost:3000');
  6   |   });
  7   | 
  8   |   test('should add checkpoint with custom radius', async ({ page }) => {
  9   |     await page.click('text=Create Race');
  10  |     await page.click('text=Create Custom Route');
  11  |     
  12  |     // Add start point
  13  |     const map = page.locator('.leaflet-container');
  14  |     await map.click({ position: { x: 400, y: 300 } });
  15  |     
  16  |     // Select checkpoint tool
  17  |     await page.locator('button:has-text("Checkpoint")').click();
  18  |     
  19  |     // Set custom radius
  20  |     await page.fill('input[name="checkpointRadius"]', '50');
  21  |     
  22  |     // Add checkpoint
  23  |     await map.click({ position: { x: 500, y: 300 } });
  24  |     
  25  |     // Check if checkpoint is added with radius
  26  |     await expect(page.locator('.leaflet-marker-icon')).toHaveCount(2);
  27  |   });
  28  | 
  29  |   test('should reorder checkpoints', async ({ page }) => {
  30  |     await page.click('text=Create Race');
  31  |     await page.click('text=Create Custom Route');
  32  |     
  33  |     const map = page.locator('.leaflet-container');
  34  |     
  35  |     // Add multiple checkpoints
  36  |     await map.click({ position: { x: 400, y: 300 } });
  37  |     await page.locator('button:has-text("Checkpoint")').click();
  38  |     await map.click({ position: { x: 450, y: 300 } });
  39  |     await map.click({ position: { x: 500, y: 300 } });
  40  |     await map.click({ position: { x: 550, y: 300 } });
  41  |     
  42  |     // Drag to reorder
  43  |     const checkpoint3 = page.locator('.checkpoint-marker').nth(2);
  44  |     await checkpoint3.dragTo(page.locator('.checkpoint-marker').first());
  45  |     
  46  |     // Verify order changed
  47  |     const order = await page.locator('.checkpoint-order').allTextContents();
  48  |     expect(order[0]).toBe('3');
  49  |   });
  50  | 
  51  |   test('should delete checkpoint', async ({ page }) => {
  52  |     await page.click('text=Create Race');
  53  |     await page.click('text=Create Custom Route');
  54  |     
  55  |     const map = page.locator('.leaflet-container');
  56  |     await map.click({ position: { x: 400, y: 300 } });
  57  |     await page.locator('button:has-text("Checkpoint")').click();
  58  |     await map.click({ position: { x: 500, y: 300 } });
  59  |     
  60  |     // Right-click checkpoint to delete
  61  |     await page.locator('.checkpoint-marker').click({ button: 'right' });
  62  |     await page.locator('text=Delete Checkpoint').click();
  63  |     
  64  |     // Check if checkpoint is removed
  65  |     await expect(page.locator('.checkpoint-marker')).toHaveCount(0);
  66  |   });
  67  | 
  68  |   test('should set checkpoint as mandatory', async ({ page }) => {
> 69  |     await page.click('text=Create Race');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  70  |     await page.click('text=Create Custom Route');
  71  |     
  72  |     const map = page.locator('.leaflet-container');
  73  |     await map.click({ position: { x: 400, y: 300 } });
  74  |     await page.locator('button:has-text("Checkpoint")').click();
  75  |     await map.click({ position: { x: 500, y: 300 } });
  76  |     
  77  |     // Set as mandatory
  78  |     await page.check('input[name="mandatoryCheckpoint"]');
  79  |     
  80  |     // Verify mandatory flag
  81  |     const isMandatory = await page.isChecked('input[name="mandatoryCheckpoint"]');
  82  |     expect(isMandatory).toBe(true);
  83  |   });
  84  | 
  85  |   test('should set checkpoint as optional', async ({ page }) => {
  86  |     await page.click('text=Create Race');
  87  |     await page.click('text=Create Custom Route');
  88  |     
  89  |     const map = page.locator('.leaflet-container');
  90  |     await map.click({ position: { x: 400, y: 300 } });
  91  |     await page.locator('button:has-text("Checkpoint")').click();
  92  |     await map.click({ position: { x: 500, y: 300 } });
  93  |     
  94  |     // Uncheck mandatory (optional)
  95  |     await page.uncheck('input[name="mandatoryCheckpoint"]');
  96  |     
  97  |     // Verify optional flag
  98  |     const isMandatory = await page.isChecked('input[name="mandatoryCheckpoint"]');
  99  |     expect(isMandatory).toBe(false);
  100 |   });
  101 | 
  102 |   test('should display checkpoint count', async ({ page }) => {
  103 |     await page.click('text=Create Race');
  104 |     await page.click('text=Create Custom Route');
  105 |     
  106 |     const map = page.locator('.leaflet-container');
  107 |     await map.click({ position: { x: 400, y: 300 } });
  108 |     await page.locator('button:has-text("Checkpoint")').click();
  109 |     await map.click({ position: { x: 500, y: 300 } });
  110 |     await map.click({ position: { x: 600, y: 300 } });
  111 |     
  112 |     // Check checkpoint count display
  113 |     await expect(page.locator('text=Checkpoints: 2')).toBeVisible();
  114 |   });
  115 | 
  116 |   test('should validate minimum checkpoints', async ({ page }) => {
  117 |     await page.click('text=Create Race');
  118 |     await page.click('text=Create Custom Route');
  119 |     
  120 |     // Add only start point
  121 |     const map = page.locator('.leaflet-container');
  122 |     await map.click({ position: { x: 400, y: 300 } });
  123 |     
  124 |     // Try to save without checkpoints
  125 |     await page.click('text=Save Route');
  126 |     
  127 |     // Check for validation error
  128 |     await expect(page.locator('text=At least 1 checkpoint required')).toBeVisible();
  129 |   });
  130 | 
  131 |   test('should duplicate checkpoint', async ({ page }) => {
  132 |     await page.click('text=Create Race');
  133 |     await page.click('text=Create Custom Route');
  134 |     
  135 |     const map = page.locator('.leaflet-container');
  136 |     await map.click({ position: { x: 400, y: 300 } });
  137 |     await page.locator('button:has-text("Checkpoint")').click();
  138 |     await map.click({ position: { x: 500, y: 300 } });
  139 |     
  140 |     // Right-click to duplicate
  141 |     await page.locator('.checkpoint-marker').click({ button: 'right' });
  142 |     await page.locator('text=Duplicate Checkpoint').click();
  143 |     
  144 |     // Check if checkpoint is duplicated
  145 |     await expect(page.locator('.checkpoint-marker')).toHaveCount(2);
  146 |   });
  147 | 
  148 |   test('should set checkpoint time limit', async ({ page }) => {
  149 |     await page.click('text=Create Race');
  150 |     await page.click('text=Create Custom Route');
  151 |     
  152 |     const map = page.locator('.leaflet-container');
  153 |     await map.click({ position: { x: 400, y: 300 } });
  154 |     await page.locator('button:has-text("Checkpoint")').click();
  155 |     await map.click({ position: { x: 500, y: 300 } });
  156 |     
  157 |     // Set time limit
  158 |     await page.fill('input[name="timeLimit"]', '30');
  159 |     
  160 |     // Verify time limit is set
  161 |     const timeLimit = await page.inputValue('input[name="timeLimit"]');
  162 |     expect(timeLimit).toBe('30');
  163 |   });
  164 | 
  165 |   test('should display checkpoint sequence number', async ({ page }) => {
  166 |     await page.click('text=Create Race');
  167 |     await page.click('text=Create Custom Route');
  168 |     
  169 |     const map = page.locator('.leaflet-container');
```
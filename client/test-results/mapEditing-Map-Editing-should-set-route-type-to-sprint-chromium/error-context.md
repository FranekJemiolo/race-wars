# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mapEditing.spec.ts >> Map Editing >> should set route type to sprint
- Location: e2e/mapEditing.spec.ts:109:7

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
  10  |     await page.click('text=Create Race');
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
> 110 |     await page.click('text=Create Race');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  111 |     await page.click('text=Create Custom Route');
  112 |     
  113 |     // Select sprint type
  114 |     await page.selectOption('select[name="routeType"]', 'sprint');
  115 |     
  116 |     // Verify selection
  117 |     const select = page.locator('select[name="routeType"]');
  118 |     await expect(select).toHaveValue('sprint');
  119 |   });
  120 | 
  121 |   test('should save route', async ({ page }) => {
  122 |     await page.click('text=Create Race');
  123 |     await page.click('text=Create Custom Route');
  124 |     
  125 |     // Add some points
  126 |     const map = page.locator('.leaflet-container');
  127 |     await map.click({ position: { x: 400, y: 300 } });
  128 |     await map.click({ position: { x: 500, y: 300 } });
  129 |     await map.click({ position: { x: 600, y: 300 } });
  130 |     
  131 |     // Enter route name
  132 |     await page.fill('input[name="routeName"]', 'Test Route');
  133 |     
  134 |     // Save route
  135 |     await page.click('text=Save Route');
  136 |     
  137 |     // Check for success message
  138 |     await expect(page.locator('text=Route saved successfully')).toBeVisible();
  139 |   });
  140 | 
  141 |   test('should cancel route creation', async ({ page }) => {
  142 |     await page.click('text=Create Race');
  143 |     await page.click('text=Create Custom Route');
  144 |     
  145 |     // Cancel
  146 |     await page.click('text=Cancel');
  147 |     
  148 |     // Check if route builder is closed
  149 |     await expect(page.locator('.route-builder')).not.toBeVisible();
  150 |   });
  151 | 
  152 |   test('should display route distance', async ({ page }) => {
  153 |     await page.click('text=Create Race');
  154 |     await page.click('text=Create Custom Route');
  155 |     
  156 |     const map = page.locator('.leaflet-container');
  157 |     await map.click({ position: { x: 400, y: 300 } });
  158 |     await map.click({ position: { x: 500, y: 300 } });
  159 |     
  160 |     // Check if distance is displayed
  161 |     await expect(page.locator('text=Distance:')).toBeVisible();
  162 |   });
  163 | 
  164 |   test('should display estimated time', async ({ page }) => {
  165 |     await page.click('text=Create Race');
  166 |     await page.click('text=Create Custom Route');
  167 |     
  168 |     const map = page.locator('.leaflet-container');
  169 |     await map.click({ position: { x: 400, y: 300 } });
  170 |     await map.click({ position: { x: 500, y: 300 } });
  171 |     
  172 |     // Check if estimated time is displayed
  173 |     await expect(page.locator('text=Estimated Time:')).toBeVisible();
  174 |   });
  175 | });
  176 | 
```
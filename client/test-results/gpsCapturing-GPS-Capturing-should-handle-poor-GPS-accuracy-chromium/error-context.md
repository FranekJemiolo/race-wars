# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gpsCapturing.spec.ts >> GPS Capturing >> should handle poor GPS accuracy
- Location: e2e/gpsCapturing.spec.ts:185:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Join Race')

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
  86  |     await page.click('text=Stop Tracking');
  87  |     
  88  |     // Check if history is saved
  89  |     await expect(page.locator('text=Positions saved:')).toBeVisible();
  90  |   });
  91  | 
  92  |   test('should handle GPS errors gracefully', async ({ page }) => {
  93  |     // Deny geolocation permission
  94  |     await page.context().clearPermissions();
  95  |     
  96  |     await page.click('text=Join Race');
  97  |     
  98  |     // Check for error message
  99  |     await expect(page.locator('text=Location permission denied')).toBeVisible();
  100 |   });
  101 | 
  102 |   test('should update position in real-time', async ({ page }) => {
  103 |     await page.click('text=Join Race');
  104 |     await page.click('text=Allow location access');
  105 |     await page.click('text=Start Tracking');
  106 |     
  107 |     // Get initial position
  108 |     const initialLat = await page.locator('[data-testid="latitude"]').textContent();
  109 |     
  110 |     // Simulate movement
  111 |     await page.context().setGeolocation({ latitude: 37.7750, longitude: -122.4195 });
  112 |     await page.waitForTimeout(2000);
  113 |     
  114 |     // Get updated position
  115 |     const updatedLat = await page.locator('[data-testid="latitude"]').textContent();
  116 |     
  117 |     // Check if position changed
  118 |     expect(initialLat).not.toBe(updatedLat);
  119 |   });
  120 | 
  121 |   test('should display GPS signal strength', async ({ page }) => {
  122 |     await page.click('text=Join Race');
  123 |     await page.click('text=Allow location access');
  124 |     await page.click('text=Start Tracking');
  125 |     
  126 |     // Check if signal strength is displayed
  127 |     await expect(page.locator('text=Signal:')).toBeVisible();
  128 |   });
  129 | 
  130 |   test('should allow high accuracy mode', async ({ page }) => {
  131 |     await page.click('text=Join Race');
  132 |     await page.click('text=Allow location access');
  133 |     
  134 |     // Enable high accuracy
  135 |     await page.check('input[name="highAccuracy"]');
  136 |     await page.click('text=Start Tracking');
  137 |     
  138 |     // Check if high accuracy is active
  139 |     await expect(page.locator('text=High Accuracy: On')).toBeVisible();
  140 |   });
  141 | 
  142 |   test('should track altitude if available', async ({ page }) => {
  143 |     await page.click('text=Join Race');
  144 |     await page.click('text=Allow location access');
  145 |     await page.click('text=Start Tracking');
  146 |     
  147 |     // Check if altitude is displayed (may be optional)
  148 |     const altitude = page.locator('text=Altitude:');
  149 |     const isVisible = await altitude.isVisible().catch(() => false);
  150 |     
  151 |     if (isVisible) {
  152 |       await expect(altitude).toBeVisible();
  153 |     }
  154 |   });
  155 | 
  156 |   test('should calculate distance traveled', async ({ page }) => {
  157 |     await page.click('text=Join Race');
  158 |     await page.click('text=Allow location access');
  159 |     await page.click('text=Start Tracking');
  160 |     
  161 |     // Simulate movement
  162 |     await page.context().setGeolocation({ latitude: 37.7750, longitude: -122.4195 });
  163 |     await page.waitForTimeout(2000);
  164 |     
  165 |     // Check if distance is calculated
  166 |     await expect(page.locator('text=Distance:')).toBeVisible();
  167 |   });
  168 | 
  169 |   test('should export GPS data', async ({ page }) => {
  170 |     await page.click('text=Join Race');
  171 |     await page.click('text=Allow location access');
  172 |     await page.click('text=Start Tracking');
  173 |     
  174 |     await page.waitForTimeout(5000);
  175 |     await page.click('text=Stop Tracking');
  176 |     
  177 |     // Export data
  178 |     await page.click('text=Export Data');
  179 |     
  180 |     // Check if download is triggered
  181 |     const downloadPromise = page.waitForEvent('download');
  182 |     await downloadPromise;
  183 |   });
  184 | 
  185 |   test('should handle poor GPS accuracy', async ({ page }) => {
> 186 |     await page.click('text=Join Race');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  187 |     await page.click('text=Allow location access');
  188 |     await page.click('text=Start Tracking');
  189 |     
  190 |     // Check if accuracy warning is shown when accuracy is poor
  191 |     const accuracyWarning = page.locator('text=Low GPS accuracy');
  192 |     const isVisible = await accuracyWarning.isVisible().catch(() => false);
  193 |     
  194 |     if (isVisible) {
  195 |       await expect(accuracyWarning).toBeVisible();
  196 |     }
  197 |   });
  198 | });
  199 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: system-integration.spec.ts >> System Integration Tests >> Error Handling >> should handle network timeouts
- Location: tests/e2e/system-integration.spec.ts:310:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Welcome Back" [level=1] [ref=e6]
    - paragraph [ref=e7]: Sign in to access races
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]: Username
      - textbox "Enter your username" [ref=e11]
    - generic [ref=e12]:
      - generic [ref=e13]: Password
      - textbox "Enter your password" [ref=e14]
    - button "Sign In" [ref=e15] [cursor=pointer]
  - button "Don't have an account? Sign up" [ref=e17] [cursor=pointer]
  - generic [ref=e20]: OR
  - button "Continue as Spectator" [ref=e23] [cursor=pointer]
  - generic [ref=e24]:
    - generic [ref=e25]: "Demo Accounts:"
    - generic [ref=e26]: "Admin: admin / admin123"
    - generic [ref=e27]: "Driver: testdriver / driver123"
```

# Test source

```ts
  219 |       await expect(page.locator('[data-testid="user-list"]')).toBeVisible({ timeout: 5000 });
  220 |       
  221 |       // Test user actions
  222 |       const userRow = page.locator('[data-testid="user-row"]').first();
  223 |       if (await userRow.isVisible()) {
  224 |         await expect(userRow.locator('button:has-text("Edit")')).toBeVisible();
  225 |         await expect(userRow.locator('button:has-text("Ban")')).toBeVisible();
  226 |       }
  227 |     });
  228 |   });
  229 | 
  230 |   test.describe('Real-time Features', () => {
  231 |     test.beforeEach(async ({ page }) => {
  232 |       await page.goto('/');
  233 |       await page.locator('input[type="email"]').fill('test@example.com');
  234 |       await page.locator('input[type="password"]').fill('password123');
  235 |       await page.locator('button[type="submit"]').click();
  236 |       await page.waitForLoadState('networkidle');
  237 |     });
  238 | 
  239 |     test('should establish WebSocket connection', async ({ page }) => {
  240 |       // Navigate to a race
  241 |       const raceCard = page.locator('[data-testid="race-card"]').first();
  242 |       if (await raceCard.isVisible()) {
  243 |         await raceCard.click();
  244 |         
  245 |         // Check for real-time updates
  246 |         await expect(page.locator('[data-testid="live-timing"]')).toBeVisible({ timeout: 10000 });
  247 |         await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
  248 |         
  249 |         // Test WebSocket connection status
  250 |         const connectionStatus = page.locator('[data-testid="connection-status"]');
  251 |         if (await connectionStatus.isVisible()) {
  252 |           await expect(connectionStatus).toContainText('Connected', { timeout: 5000 });
  253 |         }
  254 |       }
  255 |     });
  256 | 
  257 |     test('should handle real-time race updates', async ({ page }) => {
  258 |       // This would require mocking real-time data or having another browser simulate race updates
  259 |       // For now, we'll test the UI components that would display real-time data
  260 |       
  261 |       const raceCard = page.locator('[data-testid="race-card"]').first();
  262 |       if (await raceCard.isVisible()) {
  263 |         await raceCard.click();
  264 |         
  265 |         // Test live race view components
  266 |         await expect(page.locator('[data-testid="race-map"]')).toBeVisible({ timeout: 10000 });
  267 |         await expect(page.locator('[data-testid="position-tracker"]')).toBeVisible();
  268 |         await expect(page.locator('[data-testid="lap-counter"]')).toBeVisible();
  269 |       }
  270 |     });
  271 |   });
  272 | 
  273 |   test.describe('API Endpoints', () => {
  274 |     test('should validate all API endpoints', async ({ page }) => {
  275 |       // Test API endpoints through the browser
  276 |       await page.goto('/');
  277 |       
  278 |       // Test health endpoint
  279 |       const healthResponse = await page.evaluate(async () => {
  280 |         const response = await fetch('http://localhost:8082/api/health');
  281 |         return response.ok;
  282 |       });
  283 |       expect(healthResponse).toBeTruthy();
  284 |       
  285 |       // Test auth endpoints
  286 |       const loginResponse = await page.evaluate(async () => {
  287 |         const response = await fetch('http://localhost:8082/api/auth/login', {
  288 |           method: 'POST',
  289 |           headers: { 'Content-Type': 'application/json' },
  290 |           body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
  291 |         });
  292 |         return response.ok;
  293 |       });
  294 |       expect(loginResponse).toBeTruthy();
  295 |     });
  296 |   });
  297 | 
  298 |   test.describe('Error Handling', () => {
  299 |     test('should handle form validation errors', async ({ page }) => {
  300 |       await page.goto('/');
  301 |       await page.locator('button:has-text("Create Race")').click();
  302 |       
  303 |       // Try to submit empty form
  304 |       await page.locator('button[type="submit"]').click();
  305 |       
  306 |       // Should show validation errors
  307 |       await expect(page.locator('body')).toContainText('Race name is required', { timeout: 5000 });
  308 |     });
  309 | 
  310 |     test('should handle network timeouts', async ({ page }) => {
  311 |       await page.goto('/');
  312 |       
  313 |       // Simulate slow network
  314 |       await page.route('**/*', route => {
  315 |         setTimeout(() => route.continue(), 5000);
  316 |       });
  317 |       
  318 |       // Try to login
> 319 |       await page.locator('input[type="email"]').fill('test@example.com');
      |                                                 ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  320 |       await page.locator('input[type="password"]').fill('password123');
  321 |       await page.locator('button[type="submit"]').click();
  322 |       
  323 |       // Should handle slow response gracefully
  324 |       await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 10000 });
  325 |     });
  326 |   });
  327 | 
  328 |   test.describe('Performance and Load', () => {
  329 |     test('should handle concurrent users', async ({ context }) => {
  330 |       // Create multiple browser contexts to simulate concurrent users
  331 |       const contexts = await Promise.all([
  332 |         context.browser().newContext(),
  333 |         context.browser().newContext(),
  334 |         context.browser().newContext()
  335 |       ]);
  336 |       
  337 |       const pages = await Promise.all(
  338 |         contexts.map(ctx => ctx.newPage())
  339 |       );
  340 |       
  341 |       // Have all users login simultaneously
  342 |       await Promise.all(
  343 |         pages.map(async (page, index) => {
  344 |           await page.goto('/');
  345 |           await page.locator('input[type="email"]').fill(`user${index}@example.com`);
  346 |           await page.locator('input[type="password"]').fill('password123');
  347 |           await page.locator('button[type="submit"]').click();
  348 |           await page.waitForLoadState('networkidle');
  349 |         })
  350 |       );
  351 |       
  352 |       // Verify all users can access the system
  353 |       await Promise.all(
  354 |         pages.map(async page => {
  355 |           await expect(page.locator('body')).toContainText('Welcome', { timeout: 10000 });
  356 |         })
  357 |       );
  358 |       
  359 |       // Clean up
  360 |       await Promise.all(contexts.map(ctx => ctx.close()));
  361 |     });
  362 | 
  363 |     test('should handle large race lists', async ({ page }) => {
  364 |       await page.goto('/');
  365 |       await page.locator('input[type="email"]').fill('test@example.com');
  366 |       await page.locator('input[type="password"]').fill('password123');
  367 |       await page.locator('button[type="submit"]').click();
  368 |       await page.waitForLoadState('networkidle');
  369 |       
  370 |       // Test race list loading
  371 |       await expect(page.locator('[data-testid="race-list"]')).toBeVisible({ timeout: 10000 });
  372 |       
  373 |       // Test scrolling behavior using page.evaluate
  374 |       await page.evaluate(() => {
  375 |         const raceList = document.querySelector('[data-testid="race-list"]');
  376 |         if (raceList && raceList instanceof HTMLElement) {
  377 |           raceList.scrollTop = raceList.scrollHeight;
  378 |         }
  379 |       });
  380 |       await page.waitForTimeout(1000);
  381 |       
  382 |       // Should either load more races or show end of list
  383 |       const hasMoreRaces = await page.locator('[data-testid="load-more"]').isVisible();
  384 |       if (hasMoreRaces) {
  385 |         await page.locator('[data-testid="load-more"]').click();
  386 |         await page.waitForTimeout(1000);
  387 |       }
  388 |     });
  389 |   });
  390 | 
  391 |   test.describe('Accessibility', () => {
  392 |     test('should be keyboard navigable', async ({ page }) => {
  393 |       await page.goto('/');
  394 |       
  395 |       // Test keyboard navigation
  396 |       await page.keyboard.press('Tab');
  397 |       await expect(page.locator('input[type="email"]')).toBeFocused();
  398 |       
  399 |       await page.keyboard.press('Tab');
  400 |       await expect(page.locator('input[type="password"]')).toBeFocused();
  401 |       
  402 |       await page.keyboard.press('Tab');
  403 |       await expect(page.locator('button[type="submit"]')).toBeFocused();
  404 |     });
  405 | 
  406 |     test('should have proper ARIA labels', async ({ page }) => {
  407 |       await page.goto('/');
  408 |       
  409 |       // Check for proper ARIA labels
  410 |       const emailInput = page.locator('input[type="email"]');
  411 |       await expect(emailInput).toHaveAttribute('aria-label', 'Email');
  412 |       
  413 |       const passwordInput = page.locator('input[type="password"]');
  414 |       await expect(passwordInput).toHaveAttribute('aria-label', 'Password');
  415 |     });
  416 |   });
  417 | 
  418 |   test.describe('Mobile Responsiveness', () => {
  419 |     test('should work on mobile devices', async ({ page }) => {
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: system-integration.spec.ts >> System Integration Tests >> Mobile Responsiveness >> should adapt to tablet screens
- Location: tests/e2e/system-integration.spec.ts:438:9

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
  420 |       // Set mobile viewport
  421 |       await page.setViewportSize({ width: 375, height: 667 });
  422 |       
  423 |       await page.goto('/');
  424 |       
  425 |       // Test mobile layout
  426 |       await expect(page.locator('form')).toBeVisible();
  427 |       await expect(page.locator('input[type="email"]')).toBeVisible();
  428 |       await expect(page.locator('input[type="password"]')).toBeVisible();
  429 |       
  430 |       // Test mobile navigation
  431 |       await page.locator('input[type="email"]').fill('test@example.com');
  432 |       await page.locator('input[type="password"]').fill('password123');
  433 |       await page.locator('button[type="submit"]').click();
  434 |       
  435 |       await expect(page.locator('body')).toContainText('Welcome', { timeout: 10000 });
  436 |     });
  437 | 
  438 |     test('should adapt to tablet screens', async ({ page }) => {
  439 |       // Set tablet viewport
  440 |       await page.setViewportSize({ width: 768, height: 1024 });
  441 |       
  442 |       await page.goto('/');
  443 |       
  444 |       // Test tablet layout
  445 |       await expect(page.locator('form')).toBeVisible();
  446 |       
  447 |       // Login and test race list on tablet
> 448 |       await page.locator('input[type="email"]').fill('test@example.com');
      |                                                 ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  449 |       await page.locator('input[type="password"]').fill('password123');
  450 |       await page.locator('button[type="submit"]').click();
  451 |       
  452 |       await expect(page.locator('[data-testid="race-list"]')).toBeVisible({ timeout: 10000 });
  453 |     });
  454 |   });
  455 | });
  456 | 
```
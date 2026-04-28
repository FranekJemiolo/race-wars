# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: simple-runner.spec.ts >> System Validation Tests >> should validate race management interface
- Location: tests/e2e/simple-runner.spec.ts:36:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('System Validation Tests', () => {
  4   |   test('should validate application loads', async ({ page }) => {
  5   |     const response = await page.goto('/');
  6   |     expect(response?.status()).toBeLessThan(500);
  7   |     await expect(page.locator('body')).toBeVisible();
  8   |   });
  9   | 
  10  |   test('should validate authentication interface', async ({ page }) => {
  11  |     await page.goto('/');
  12  |     
  13  |     // Check for form elements
  14  |     const hasEmail = await page.locator('input[type="email"], input[name="email"]').isVisible().catch(() => false);
  15  |     const hasPassword = await page.locator('input[type="password"], input[name="password"]').isVisible().catch(() => false);
  16  |     const hasSubmit = await page.locator('button[type="submit"]').isVisible().catch(() => false);
  17  |     
  18  |     expect(hasEmail || hasPassword || hasSubmit).toBeTruthy();
  19  |   });
  20  | 
  21  |   test('should validate API endpoints', async ({ page }) => {
  22  |     // Test health endpoint
  23  |     const healthCheck = await page.evaluate(async () => {
  24  |       try {
  25  |         const response = await fetch('http://localhost:8082/api/health');
  26  |         return { status: response.status, ok: response.ok };
  27  |       } catch {
  28  |         return { status: 0, ok: false };
  29  |       }
  30  |     });
  31  |     
  32  |     // API should respond
  33  |     expect(healthCheck.status).toBeGreaterThan(0);
  34  |   });
  35  | 
  36  |   test('should validate race management interface', async ({ page }) => {
  37  |     await page.goto('/');
  38  |     
  39  |     // Look for race management elements
  40  |     const createRace = await page.locator('button:has-text("Create Race")').isVisible().catch(() => false);
  41  |     const raceList = await page.locator('[data-testid="race-list"]').isVisible().catch(() => false);
  42  |     
  43  |     // Should have either create button or race list
> 44  |     expect(createRace || raceList).toBeTruthy();
      |                                    ^ Error: expect(received).toBeTruthy()
  45  |   });
  46  | 
  47  |   test('should validate responsive design', async ({ page }) => {
  48  |     // Test mobile viewport
  49  |     await page.setViewportSize({ width: 375, height: 667 });
  50  |     await page.goto('/');
  51  |     
  52  |     const hasContent = await page.locator('body').isVisible();
  53  |     expect(hasContent).toBeTruthy();
  54  |     
  55  |     // Test desktop viewport
  56  |     await page.setViewportSize({ width: 1920, height: 1080 });
  57  |     await page.goto('/');
  58  |     
  59  |     const hasDesktopContent = await page.locator('body').isVisible();
  60  |     expect(hasDesktopContent).toBeTruthy();
  61  |   });
  62  | 
  63  |   test('should validate error handling', async ({ page }) => {
  64  |     // Test 404 handling
  65  |     const response = await page.goto('/nonexistent-page');
  66  |     expect(response?.status()).toBe(404);
  67  |   });
  68  | });
  69  | 
  70  | test.describe('Component Integration Tests', () => {
  71  |   test('should validate route builder integration', async ({ page }) => {
  72  |     await page.goto('/');
  73  |     
  74  |     // Look for route builder access
  75  |     const createRace = await page.locator('button:has-text("Create Race")').isVisible().catch(() => false);
  76  |     
  77  |     if (createRace === true) {
  78  |       await page.locator('button:has-text("Create Race")').click();
  79  |       
  80  |       // Check for route builder elements
  81  |       const routeBuilder = await page.locator('button:has-text("Create New Route"), button:has-text("Route Builder")').isVisible().catch(() => false);
  82  |       expect(routeBuilder).toBeTruthy();
  83  |     }
  84  |   });
  85  | 
  86  |   test('should validate admin console integration', async ({ page }) => {
  87  |     await page.goto('/');
  88  |     
  89  |     // Look for admin console access
  90  |     const adminButton = await page.locator('button:has-text("Admin Console"), a:has-text("Admin")').isVisible().catch(() => false);
  91  |     
  92  |     if (adminButton === true) {
  93  |       await page.locator('button:has-text("Admin Console"), a:has-text("Admin")').click();
  94  |       
  95  |       // Check for admin elements
  96  |       const adminContent = await page.locator('h1:has-text("Admin"), h1:has-text("Console")').isVisible().catch(() => false);
  97  |       expect(adminContent).toBeTruthy();
  98  |     }
  99  |   });
  100 | });
  101 | 
  102 | test.describe('Performance Tests', () => {
  103 |   test('should load within acceptable time', async ({ page }) => {
  104 |     const startTime = Date.now();
  105 |     await page.goto('/');
  106 |     await page.waitForLoadState('networkidle');
  107 |     const loadTime = Date.now() - startTime;
  108 |     
  109 |     // Should load within 10 seconds
  110 |     expect(loadTime).toBeLessThan(10000);
  111 |   });
  112 | 
  113 |   test('should handle concurrent access', async ({ context }) => {
  114 |     // Test multiple pages
  115 |     const pages = await Promise.all([
  116 |       context.newPage(),
  117 |       context.newPage()
  118 |     ]);
  119 |     
  120 |     await Promise.all(pages.map(page => page.goto('/')));
  121 |     
  122 |     // All pages should load
  123 |     for (const page of pages) {
  124 |       await expect(page.locator('body')).toBeVisible();
  125 |     }
  126 |     
  127 |     // Clean up
  128 |     await Promise.all(pages.map(page => page.close()));
  129 |   });
  130 | });
  131 | 
```
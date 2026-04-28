# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: system-integration.spec.ts >> System Integration Tests >> Authentication Flow >> should handle authentication errors
- Location: tests/e2e/system-integration.spec.ts:39:9

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('System Integration Tests', () => {
  4   |   test.describe('Authentication Flow', () => {
  5   |     test('should complete full authentication cycle', async ({ page }) => {
  6   |       await page.goto('/');
  7   |       
  8   |       // Test login form visibility
  9   |       await expect(page.locator('form')).toBeVisible();
  10  |       await expect(page.locator('input[type="email"]')).toBeVisible();
  11  |       await expect(page.locator('input[type="password"]')).toBeVisible();
  12  |       
  13  |       // Test registration
  14  |       await page.locator('button:has-text("Register")').click();
  15  |       await expect(page.locator('input[name="name"]')).toBeVisible();
  16  |       
  17  |       const timestamp = Date.now();
  18  |       await page.locator('input[name="name"]').fill(`Test User ${timestamp}`);
  19  |       await page.locator('input[name="email"]').fill(`test${timestamp}@example.com`);
  20  |       await page.locator('input[name="password"]').fill('password123');
  21  |       await page.locator('input[name="confirmPassword"]').fill('password123');
  22  |       await page.locator('button[type="submit"]').click();
  23  |       
  24  |       // Should redirect to main app or show success
  25  |       await expect(page.locator('body')).toContainText('Welcome', { timeout: 10000 });
  26  |       
  27  |       // Test logout
  28  |       await page.locator('button:has-text("Logout")').click();
  29  |       await expect(page.locator('form')).toBeVisible({ timeout: 5000 });
  30  |       
  31  |       // Test login with new credentials
  32  |       await page.locator('input[type="email"]').fill(`test${timestamp}@example.com`);
  33  |       await page.locator('input[type="password"]').fill('password123');
  34  |       await page.locator('button[type="submit"]').click();
  35  |       
  36  |       await expect(page.locator('body')).toContainText('Welcome', { timeout: 10000 });
  37  |     });
  38  | 
  39  |     test('should handle authentication errors', async ({ page }) => {
  40  |       await page.goto('/');
  41  |       
  42  |       // Test invalid login
> 43  |       await page.locator('input[type="email"]').fill('invalid@example.com');
      |                                                 ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  44  |       await page.locator('input[type="password"]').fill('wrongpassword');
  45  |       await page.locator('button[type="submit"]').click();
  46  |       
  47  |       await expect(page.locator('body')).toContainText('Invalid credentials', { timeout: 5000 });
  48  |     });
  49  |   });
  50  | 
  51  |   test.describe('Race Management', () => {
  52  |     test.beforeEach(async ({ page }) => {
  53  |       // Login for race management tests
  54  |       await page.goto('/');
  55  |       await page.locator('input[type="email"]').fill('test@example.com');
  56  |       await page.locator('input[type="password"]').fill('password123');
  57  |       await page.locator('button[type="submit"]').click();
  58  |       await page.waitForLoadState('networkidle');
  59  |     });
  60  | 
  61  |     test('should create and manage races', async ({ page }) => {
  62  |       // Navigate to race creation
  63  |       await page.locator('button:has-text("Create Race")').click();
  64  |       
  65  |       // Fill race form
  66  |       const timestamp = Date.now();
  67  |       await page.locator('input[name="name"]').fill(`Test Race ${timestamp}`);
  68  |       await page.locator('textarea[name="description"]').fill('A comprehensive test race');
  69  |       
  70  |       // Select race type
  71  |       await page.locator('select[name="type"]').selectOption('circuit');
  72  |       
  73  |       // Configure participants
  74  |       await page.locator('input[name="maxParticipants"]').fill('10');
  75  |       
  76  |       // Set start time
  77  |       const startTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  78  |       await page.locator('input[name="startTime"]').fill(startTime);
  79  |       
  80  |       // Submit race
  81  |       await page.locator('button[type="submit"]').click();
  82  |       
  83  |       // Verify race creation
  84  |       await expect(page.locator('body')).toContainText('Race created successfully', { timeout: 10000 });
  85  |       
  86  |       // Navigate to race list
  87  |       await page.goto('/');
  88  |       await expect(page.locator('body')).toContainText(`Test Race ${timestamp}`, { timeout: 5000 });
  89  |     });
  90  | 
  91  |     test('should join and leave races', async ({ page }) => {
  92  |       // Find available race
  93  |       await page.goto('/');
  94  |       const raceCard = page.locator('[data-testid="race-card"]').first();
  95  |       if (await raceCard.isVisible()) {
  96  |         await raceCard.click();
  97  |         
  98  |         // Join race
  99  |         await page.locator('button:has-text("Join Race")').click();
  100 |         await expect(page.locator('body')).toContainText('Joined race successfully', { timeout: 5000 });
  101 |         
  102 |         // Leave race
  103 |         await page.locator('button:has-text("Leave Race")').click();
  104 |         await expect(page.locator('body')).toContainText('Left race successfully', { timeout: 5000 });
  105 |       }
  106 |     });
  107 |   });
  108 | 
  109 |   test.describe('Route Builder', () => {
  110 |     test.beforeEach(async ({ page }) => {
  111 |       // Login for route builder tests
  112 |       await page.goto('/');
  113 |       await page.locator('input[type="email"]').fill('test@example.com');
  114 |       await page.locator('input[type="password"]').fill('password123');
  115 |       await page.locator('button[type="submit"]').click();
  116 |       await page.waitForLoadState('networkidle');
  117 |     });
  118 | 
  119 |     test('should create custom routes', async ({ page }) => {
  120 |       // Navigate to race creation
  121 |       await page.locator('button:has-text("Create Race")').click();
  122 |       
  123 |       // Open route builder
  124 |       await page.locator('button:has-text("Create New Route")').click();
  125 |       
  126 |       // Wait for map to load
  127 |       await expect(page.locator('#map')).toBeVisible({ timeout: 10000 });
  128 |       
  129 |       // Test route creation tools
  130 |       await expect(page.locator('button:has-text("Add Start")')).toBeVisible();
  131 |       await expect(page.locator('button:has-text("Add Checkpoint")')).toBeVisible();
  132 |       await expect(page.locator('button:has-text("Add Finish")')).toBeVisible();
  133 |       
  134 |       // Create a simple route
  135 |       await page.locator('button:has-text("Add Start")').click();
  136 |       // Simulate clicking on map
  137 |       await page.locator('#map').click({ position: { x: 200, y: 200 } });
  138 |       
  139 |       await page.locator('button:has-text("Add Finish")').click();
  140 |       await page.locator('#map').click({ position: { x: 400, y: 200 } });
  141 |       
  142 |       // Save route
  143 |       await page.locator('button:has-text("Save Route")').click();
```
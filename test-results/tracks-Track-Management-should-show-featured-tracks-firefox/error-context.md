# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracks.spec.ts >> Track Management >> should show featured tracks
- Location: tests/e2e/tracks.spec.ts:130:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

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
  3   | test.describe('Track Management', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Login before each test
  6   |     await page.goto('/login');
> 7   |     await page.locator('input[name="email"]').fill('test@example.com');
      |                                               ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  8   |     await page.locator('input[name="password"]').fill('password123');
  9   |     await page.locator('button[type="submit"]').click();
  10  |     await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  11  |   });
  12  | 
  13  |   test('should display tracks list', async ({ page }) => {
  14  |     await page.goto('/tracks');
  15  |     
  16  |     // Check tracks list is visible
  17  |     await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  18  |     const trackCards = page.locator('[data-testid="track-card"]');
  19  |     await expect(trackCards.first()).toBeVisible();
  20  |   });
  21  | 
  22  |   test('should search tracks', async ({ page }) => {
  23  |     await page.goto('/tracks');
  24  |     
  25  |     // Enter search term
  26  |     await page.locator('[data-testid="search-input"]').fill('test');
  27  |     await page.locator('[data-testid="search-button"]').click();
  28  |     
  29  |     // Check search results
  30  |     await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  31  |   });
  32  | 
  33  |   test('should filter tracks by type', async ({ page }) => {
  34  |     await page.goto('/tracks');
  35  |     
  36  |     // Select track type filter
  37  |     await page.locator('[data-testid="type-filter"]').selectOption('CIRCUIT');
  38  |     
  39  |     // Check filtered results
  40  |     await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  41  |   });
  42  | 
  43  |   test('should filter tracks by difficulty', async ({ page }) => {
  44  |     await page.goto('/tracks');
  45  |     
  46  |     // Select difficulty filter
  47  |     await page.locator('[data-testid="difficulty-filter"]').selectOption('MODERATE');
  48  |     
  49  |     // Check filtered results
  50  |     await expect(page.locator('[data-testid="tracks-list"]')).toBeVisible();
  51  |   });
  52  | 
  53  |   test('should show track details', async ({ page }) => {
  54  |     await page.goto('/tracks');
  55  |     
  56  |     // Click on first track
  57  |     await page.locator('[data-testid="track-card"]').first().click();
  58  |     
  59  |     // Check track details page
  60  |     await expect(page.locator('[data-testid="track-details"]')).toBeVisible();
  61  |     await expect(page.locator('[data-testid="track-name"]')).toBeVisible();
  62  |     await expect(page.locator('[data-testid="track-description"]')).toBeVisible();
  63  |     await expect(page.locator('[data-testid="track-map"]')).toBeVisible();
  64  |   });
  65  | 
  66  |   test('should create new track', async ({ page }) => {
  67  |     await page.goto('/tracks');
  68  |     
  69  |     // Click create button
  70  |     await page.locator('[data-testid="create-track-button"]').click();
  71  |     
  72  |     // Check create form is visible
  73  |     await expect(page.locator('[data-testid="track-form"]')).toBeVisible();
  74  |     await expect(page.locator('input[name="name"]')).toBeVisible();
  75  |     await expect(page.locator('textarea[name="description"]')).toBeVisible();
  76  |     await expect(page.locator('input[name="locationName"]')).toBeVisible();
  77  |     
  78  |     // Fill form
  79  |     await page.locator('input[name="name"]').fill('Test Track');
  80  |     await page.locator('textarea[name="description"]').fill('A test track for E2E testing');
  81  |     await page.locator('input[name="locationName"]').fill('Test Location');
  82  |     await page.locator('select[name="trackType"]').selectOption('CIRCUIT');
  83  |     await page.locator('select[name="difficultyLevel"]').selectOption('MODERATE');
  84  |     
  85  |     // Submit form (would need to upload centerline data in real implementation)
  86  |     await page.locator('button[type="submit"]').click();
  87  |     
  88  |     // Check for success message or redirect
  89  |     await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  90  |   });
  91  | 
  92  |   test('should edit existing track', async ({ page }) => {
  93  |     await page.goto('/tracks');
  94  |     
  95  |     // Click on first track
  96  |     await page.locator('[data-testid="track-card"]').first().click();
  97  |     
  98  |     // Click edit button
  99  |     await page.locator('[data-testid="edit-track-button"]').click();
  100 |     
  101 |     // Check edit form is visible
  102 |     await expect(page.locator('[data-testid="track-form"]')).toBeVisible();
  103 |     
  104 |     // Update track name
  105 |     await page.locator('input[name="name"]').fill('Updated Test Track');
  106 |     
  107 |     // Submit form
```
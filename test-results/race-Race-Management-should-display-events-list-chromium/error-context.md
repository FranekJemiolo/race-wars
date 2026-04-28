# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: race.spec.ts >> Race Management >> should display events list
- Location: tests/e2e/race.spec.ts:13:7

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
  3   | test.describe('Race Management', () => {
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
  13  |   test('should display events list', async ({ page }) => {
  14  |     await page.goto('/events');
  15  |     
  16  |     // Check events list is visible
  17  |     await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
  18  |     const eventCards = page.locator('[data-testid="event-card"]');
  19  |     await expect(eventCards.first()).toBeVisible();
  20  |   });
  21  | 
  22  |   test('should create new event', async ({ page }) => {
  23  |     await page.goto('/events');
  24  |     
  25  |     // Click create button
  26  |     await page.locator('[data-testid="create-event-button"]').click();
  27  |     
  28  |     // Check create form is visible
  29  |     await expect(page.locator('[data-testid="event-form"]')).toBeVisible();
  30  |     await expect(page.locator('input[name="name"]')).toBeVisible();
  31  |     await expect(page.locator('textarea[name="description"]')).toBeVisible();
  32  |     await expect(page.locator('select[name="eventType"]')).toBeVisible();
  33  |     
  34  |     // Fill form
  35  |     const timestamp = Date.now();
  36  |     await page.locator('input[name="name"]').fill(`Test Event ${timestamp}`);
  37  |     await page.locator('textarea[name="description"]').fill('A test event for E2E testing');
  38  |     await page.locator('select[name="eventType"]').selectOption('TRACK_DAY');
  39  |     await page.locator('input[name="startDate"]').fill('2024-12-01');
  40  |     await page.locator('input[name="endDate"]').fill('2024-12-01');
  41  |     
  42  |     // Select track
  43  |     await page.locator('select[name="trackId"]').selectOption({ index: 0 });
  44  |     
  45  |     // Submit form
  46  |     await page.locator('button[type="submit"]').click();
  47  |     
  48  |     // Check for success message
  49  |     await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  50  |   });
  51  | 
  52  |   test('should show event details', async ({ page }) => {
  53  |     await page.goto('/events');
  54  |     
  55  |     // Click on first event
  56  |     await page.locator('[data-testid="event-card"]').first().click();
  57  |     
  58  |     // Check event details page
  59  |     await expect(page.locator('[data-testid="event-details"]')).toBeVisible();
  60  |     await expect(page.locator('[data-testid="event-name"]')).toBeVisible();
  61  |     await expect(page.locator('[data-testid="event-description"]')).toBeVisible();
  62  |     await expect(page.locator('[data-testid="event-sessions"]')).toBeVisible();
  63  |   });
  64  | 
  65  |   test('should create race session', async ({ page }) => {
  66  |     await page.goto('/events');
  67  |     
  68  |     // Click on first event
  69  |     await page.locator('[data-testid="event-card"]').first().click();
  70  |     
  71  |     // Click create session button
  72  |     await page.locator('[data-testid="create-session-button"]').click();
  73  |     
  74  |     // Check session form is visible
  75  |     await expect(page.locator('[data-testid="session-form"]')).toBeVisible();
  76  |     
  77  |     // Fill form
  78  |     await page.locator('input[name="name"]').fill('Test Session');
  79  |     await page.locator('select[name="sessionType"]').selectOption('PRACTICE');
  80  |     await page.locator('input[name="startTime"]').fill('09:00');
  81  |     await page.locator('input[name="endTime"]').fill('10:00');
  82  |     await page.locator('input[name="maxParticipants"]').fill('20');
  83  |     
  84  |     // Submit form
  85  |     await page.locator('button[type="submit"]').click();
  86  |     
  87  |     // Check for success message
  88  |     await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  89  |   });
  90  | 
  91  |   test('should register for session', async ({ page }) => {
  92  |     await page.goto('/events');
  93  |     
  94  |     // Click on first event
  95  |     await page.locator('[data-testid="event-card"]').first().click();
  96  |     
  97  |     // Click on first session
  98  |     await page.locator('[data-testid="session-card"]').first().click();
  99  |     
  100 |     // Click register button
  101 |     await page.locator('[data-testid="register-button"]').click();
  102 |     
  103 |     // Check registration form
  104 |     await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();
  105 |     
  106 |     // Fill form
  107 |     await page.locator('input[name="carMake"]').fill('Test Car');
```
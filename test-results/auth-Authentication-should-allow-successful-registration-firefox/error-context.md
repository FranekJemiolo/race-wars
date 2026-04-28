# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should allow successful registration
- Location: tests/e2e/auth.spec.ts:64:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="register-link"]')

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
  3   | test.describe('Authentication', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |   });
  7   | 
  8   |   test('should display login form', async ({ page }) => {
  9   |     // Check if login form is visible
  10  |     await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  11  |     await expect(page.locator('input[name="email"]')).toBeVisible();
  12  |     await expect(page.locator('input[name="password"]')).toBeVisible();
  13  |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  14  |   });
  15  | 
  16  |   test('should show validation errors for empty fields', async ({ page }) => {
  17  |     // Try to submit empty form
  18  |     await page.locator('button[type="submit"]').click();
  19  |     
  20  |     // Check for validation errors
  21  |     await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  22  |     await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  23  |   });
  24  | 
  25  |   test('should show error for invalid credentials', async ({ page }) => {
  26  |     // Fill form with invalid credentials
  27  |     await page.locator('input[name="email"]').fill('invalid@example.com');
  28  |     await page.locator('input[name="password"]').fill('wrongpassword');
  29  |     await page.locator('button[type="submit"]').click();
  30  |     
  31  |     // Check for error message
  32  |     await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
  33  |     await expect(page.locator('[data-testid="auth-error"]')).toContainText('Invalid credentials');
  34  |   });
  35  | 
  36  |   test('should navigate to register form', async ({ page }) => {
  37  |     // Click register link
  38  |     await page.locator('[data-testid="register-link"]').click();
  39  |     
  40  |     // Check register form is visible
  41  |     await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
  42  |     await expect(page.locator('input[name="name"]')).toBeVisible();
  43  |     await expect(page.locator('input[name="email"]')).toBeVisible();
  44  |     await expect(page.locator('input[name="password"]')).toBeVisible();
  45  |     await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  46  |   });
  47  | 
  48  |   test('should validate password confirmation', async ({ page }) => {
  49  |     // Navigate to register form
  50  |     await page.locator('[data-testid="register-link"]').click();
  51  |     
  52  |     // Fill form with mismatched passwords
  53  |     await page.locator('input[name="name"]').fill('Test User');
  54  |     await page.locator('input[name="email"]').fill('test@example.com');
  55  |     await page.locator('input[name="password"]').fill('password123');
  56  |     await page.locator('input[name="confirmPassword"]').fill('differentpassword');
  57  |     await page.locator('button[type="submit"]').click();
  58  |     
  59  |     // Check for password mismatch error
  60  |     await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  61  |     await expect(page.locator('[data-testid="password-error"]')).toContainText('Passwords do not match');
  62  |   });
  63  | 
  64  |   test('should allow successful registration', async ({ page }) => {
  65  |     // Navigate to register form
> 66  |     await page.locator('[data-testid="register-link"]').click();
      |                                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  67  |     
  68  |     // Fill form with valid data
  69  |     const timestamp = Date.now();
  70  |     await page.locator('input[name="name"]').fill(`Test User ${timestamp}`);
  71  |     await page.locator('input[name="email"]').fill(`test${timestamp}@example.com`);
  72  |     await page.locator('input[name="password"]').fill('password123');
  73  |     await page.locator('input[name="confirmPassword"]').fill('password123');
  74  |     await page.locator('button[type="submit"]').click();
  75  |     
  76  |     // Check for success message or redirect
  77  |     await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  78  |   });
  79  | 
  80  |   test('should allow successful login', async ({ page }) => {
  81  |     // This test assumes there's a test user or we use the registered user
  82  |     await page.locator('input[name="email"]').fill('test@example.com');
  83  |     await page.locator('input[name="password"]').fill('password123');
  84  |     await page.locator('button[type="submit"]').click();
  85  |     
  86  |     // Check for successful login (redirect to dashboard or user menu)
  87  |     await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  88  |   });
  89  | 
  90  |   test('should allow password reset', async ({ page }) => {
  91  |     // Click forgot password link
  92  |     await page.locator('[data-testid="forgot-password-link"]').click();
  93  |     
  94  |     // Check reset form is visible
  95  |     await expect(page.locator('[data-testid="reset-form"]')).toBeVisible();
  96  |     await expect(page.locator('input[name="email"]')).toBeVisible();
  97  |     
  98  |     // Fill email and submit
  99  |     await page.locator('input[name="email"]').fill('test@example.com');
  100 |     await page.locator('button[type="submit"]').click();
  101 |     
  102 |     // Check for success message
  103 |     await expect(page.locator('[data-testid="reset-success"]')).toBeVisible();
  104 |   });
  105 | 
  106 |   test('should logout successfully', async ({ page }) => {
  107 |     // First login
  108 |     await page.locator('input[name="email"]').fill('test@example.com');
  109 |     await page.locator('input[name="password"]').fill('password123');
  110 |     await page.locator('button[type="submit"]').click();
  111 |     
  112 |     // Wait for login
  113 |     await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  114 |     
  115 |     // Click logout
  116 |     await page.locator('[data-testid="user-menu"]').click();
  117 |     await page.locator('[data-testid="logout-button"]').click();
  118 |     
  119 |     // Check redirect to login
  120 |     await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  121 |   });
  122 | });
  123 | 
```
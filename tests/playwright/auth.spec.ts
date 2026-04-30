import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Check for validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.locator('input[name="email"]').fill('invalid@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    // Check for error message
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error"]')).toContainText('Invalid credentials');
  });

  test('should navigate to register form', async ({ page }) => {
    // Click register link
    await page.locator('[data-testid="register-link"]').click();
    
    // Check register form is visible
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    // Navigate to register form
    await page.locator('[data-testid="register-link"]').click();
    
    // Fill form with mismatched passwords
    await page.locator('input[name="name"]').fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('input[name="confirmPassword"]').fill('differentpassword');
    await page.locator('button[type="submit"]').click();
    
    // Check for password mismatch error
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Passwords do not match');
  });

  test('should allow successful registration', async ({ page }) => {
    // Navigate to register form
    await page.locator('[data-testid="register-link"]').click();
    
    // Fill form with valid data
    const timestamp = Date.now();
    await page.locator('input[name="name"]').fill(`Test User ${timestamp}`);
    await page.locator('input[name="email"]').fill(`test${timestamp}@example.com`);
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('input[name="confirmPassword"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Check for success message or redirect
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should allow successful login', async ({ page }) => {
    // This test assumes there's a test user or we use the registered user
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Check for successful login (redirect to dashboard or user menu)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  });

  test('should allow password reset', async ({ page }) => {
    // Click forgot password link
    await page.locator('[data-testid="forgot-password-link"]').click();
    
    // Check reset form is visible
    await expect(page.locator('[data-testid="reset-form"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    
    // Fill email and submit
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('button[type="submit"]').click();
    
    // Check for success message
    await expect(page.locator('[data-testid="reset-success"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Wait for login
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
    
    // Click logout
    await page.locator('[data-testid="user-menu"]').click();
    await page.locator('[data-testid="logout-button"]').click();
    
    // Check redirect to login
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });
});

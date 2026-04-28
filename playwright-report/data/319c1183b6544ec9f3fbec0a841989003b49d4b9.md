# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: working-tests.spec.ts >> Working E2E Tests >> Error Handling >> should handle network errors
- Location: tests/e2e/working-tests.spec.ts:216:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"], input[name="email"]')

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
  133 |         await adminButton.click();
  134 |         
  135 |         // Check for admin dashboard elements
  136 |         await expect(page.locator('h1:has-text("Admin"), h1:has-text("Console")')).toBeVisible({ timeout: 10000 });
  137 |         
  138 |         // Look for admin features
  139 |         const hasAdminFeatures = await Promise.any([
  140 |           page.locator('[data-testid="race-stats"]').isVisible().catch(() => false),
  141 |           page.locator('[data-testid="user-stats"]').isVisible().catch(() => false),
  142 |           page.locator('button:has-text("Manage Races")').isVisible().catch(() => false),
  143 |           page.locator('button:has-text("Manage Users")').isVisible().catch(() => false)
  144 |         ]);
  145 |         
  146 |         expect(hasAdminFeatures).toBeTruthy();
  147 |       }
  148 |     });
  149 |   });
  150 | 
  151 |   test.describe('API Endpoints', () => {
  152 |     test('should validate API health', async ({ page }) => {
  153 |       await page.goto('/');
  154 |       
  155 |       // Test API health endpoint
  156 |       const healthCheck = await page.evaluate(async () => {
  157 |         try {
  158 |           const response = await fetch('http://localhost:8082/api/health');
  159 |           return { status: response.status, ok: response.ok };
  160 |         } catch (error) {
  161 |           return { status: 0, ok: false, error: (error as Error).message };
  162 |         }
  163 |       });
  164 |       
  165 |       // API should be accessible
  166 |       expect(healthCheck.status).toBeGreaterThan(0);
  167 |     });
  168 | 
  169 |     test('should validate authentication endpoint', async ({ page }) => {
  170 |       await page.goto('/');
  171 |       
  172 |       // Test auth login endpoint
  173 |       const authTest = await page.evaluate(async () => {
  174 |         try {
  175 |           const response = await fetch('http://localhost:8082/api/auth/login', {
  176 |             method: 'POST',
  177 |             headers: { 'Content-Type': 'application/json' },
  178 |             body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
  179 |           });
  180 |           return { status: response.status, ok: response.ok };
  181 |         } catch (error) {
  182 |           return { status: 0, ok: false, error: (error as Error).message };
  183 |         }
  184 |       });
  185 |       
  186 |       // Auth endpoint should respond (either success or unauthorized)
  187 |       expect(authTest.status).toBeGreaterThan(0);
  188 |     });
  189 |   });
  190 | 
  191 |   test.describe('Error Handling', () => {
  192 |     test('should handle invalid routes gracefully', async ({ page }) => {
  193 |       const response = await page.goto('/invalid-route');
  194 |       
  195 |       // Should handle 404 gracefully
  196 |       expect(response?.status()).toBeLessThan(500);
  197 |     });
  198 | 
  199 |     test('should handle form validation', async ({ page }) => {
  200 |       await page.goto('/');
  201 |       
  202 |       // Try to find and submit a form without filling required fields
  203 |       const loginForm = page.locator('form');
  204 |       const hasLoginForm = await loginForm.isVisible().catch(() => false);
  205 |       
  206 |       if (hasLoginForm) {
  207 |         await page.locator('button[type="submit"]').click();
  208 |         
  209 |         // Should show validation errors or remain on login page
  210 |         await page.waitForTimeout(1000);
  211 |         const stillOnLogin = await loginForm.isVisible().catch(() => false);
  212 |         expect(stillOnLogin).toBeTruthy();
  213 |       }
  214 |     });
  215 | 
  216 |     test('should handle network errors', async ({ page }) => {
  217 |       await page.goto('/');
  218 |       
  219 |       // Mock network failure
  220 |       await page.route('**/*', route => {
  221 |         if (route.request().url().includes('api/')) {
  222 |           route.abort('failed');
  223 |         } else {
  224 |           route.continue();
  225 |         }
  226 |       });
  227 |       
  228 |       // Try to login
  229 |       const loginForm = page.locator('form');
  230 |       const hasLoginForm = await loginForm.isVisible().catch(() => false);
  231 |       
  232 |       if (hasLoginForm) {
> 233 |         await page.locator('input[type="email"], input[name="email"]').fill('test@example.com');
      |                                                                        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  234 |         await page.locator('input[type="password"], input[name="password"]').fill('password123');
  235 |         await page.locator('button[type="submit"]').click();
  236 |         
  237 |         // Should handle network error gracefully
  238 |         await page.waitForTimeout(2000);
  239 |         const stillOnLogin = await loginForm.isVisible().catch(() => false);
  240 |         expect(stillOnLogin).toBeTruthy();
  241 |       }
  242 |     });
  243 |   });
  244 | 
  245 |   test.describe('Responsive Design', () => {
  246 |     test('should work on mobile viewport', async ({ page }) => {
  247 |       await page.setViewportSize({ width: 375, height: 667 });
  248 |       await page.goto('/');
  249 |       
  250 |       // Check mobile compatibility
  251 |       await expect(page.locator('body')).toBeVisible();
  252 |       
  253 |       const loginForm = page.locator('form');
  254 |       const hasLoginForm = await loginForm.isVisible().catch(() => false);
  255 |       
  256 |       if (hasLoginForm) {
  257 |         await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  258 |         await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  259 |         await expect(page.locator('button[type="submit"]')).toBeVisible();
  260 |       }
  261 |     });
  262 | 
  263 |     test('should work on tablet viewport', async ({ page }) => {
  264 |       await page.setViewportSize({ width: 768, height: 1024 });
  265 |       await page.goto('/');
  266 |       
  267 |       // Check tablet compatibility
  268 |       await expect(page.locator('body')).toBeVisible();
  269 |       
  270 |       const loginForm = page.locator('form');
  271 |       const hasLoginForm = await loginForm.isVisible().catch(() => false);
  272 |       
  273 |       if (hasLoginForm) {
  274 |         await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  275 |         await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  276 |         await expect(page.locator('button[type="submit"]')).toBeVisible();
  277 |       }
  278 |     });
  279 |   });
  280 | 
  281 |   test.describe('Accessibility', () => {
  282 |     test('should support keyboard navigation', async ({ page }) => {
  283 |       await page.goto('/');
  284 |       
  285 |       // Test keyboard navigation
  286 |       await page.keyboard.press('Tab');
  287 |       
  288 |       // Should focus on interactive elements
  289 |       const focusedElement = await page.locator(':focus').isVisible().catch(() => false);
  290 |       expect(focusedElement).toBeTruthy();
  291 |     });
  292 | 
  293 |     test('should have proper headings structure', async ({ page }) => {
  294 |       await page.goto('/');
  295 |       
  296 |       // Check for proper heading structure
  297 |       const hasHeading = await page.locator('h1, h2, h3').isVisible().catch(() => false);
  298 |       expect(hasHeading).toBeTruthy();
  299 |     });
  300 |   });
  301 | 
  302 |   test.describe('Performance', () => {
  303 |     test('should load within reasonable time', async ({ page }) => {
  304 |       const startTime = Date.now();
  305 |       await page.goto('/');
  306 |       await page.waitForLoadState('networkidle');
  307 |       const loadTime = Date.now() - startTime;
  308 |       
  309 |       // Should load within 10 seconds
  310 |       expect(loadTime).toBeLessThan(10000);
  311 |     });
  312 | 
  313 |     test('should handle concurrent page loads', async ({ context }) => {
  314 |       // Create multiple pages
  315 |       const pages = await Promise.all([
  316 |         context.newPage(),
  317 |         context.newPage(),
  318 |         context.newPage()
  319 |       ]);
  320 |       
  321 |       // Load pages concurrently
  322 |       const loadPromises = pages.map(page => 
  323 |         page.goto('/').then(() => page.waitForLoadState('networkidle'))
  324 |       );
  325 |       
  326 |       await Promise.all(loadPromises);
  327 |       
  328 |       // All pages should load successfully
  329 |       for (const page of pages) {
  330 |         await expect(page.locator('body')).toBeVisible();
  331 |       }
  332 |       
  333 |       // Clean up
```
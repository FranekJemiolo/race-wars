# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: working-tests.spec.ts >> Working E2E Tests >> Basic Functionality >> should handle admin console interface
- Location: tests/e2e/working-tests.spec.ts:114:9

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
  22  |       // Look for login form
  23  |       const loginForm = page.locator('form');
  24  |       const hasLoginForm = await loginForm.isVisible().catch(() => false);
  25  |       
  26  |       if (hasLoginForm) {
  27  |         // Test login form elements
  28  |         await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  29  |         await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  30  |         await expect(page.locator('button[type="submit"]')).toBeVisible();
  31  |         
  32  |         // Test registration link if present
  33  |         const registerLink = page.locator('button:has-text("Register"), a:has-text("Register")');
  34  |         if (await registerLink.isVisible().catch(() => false)) {
  35  |           await registerLink.click();
  36  |           await expect(page.locator('input[name="name"], input[name="username"]')).toBeVisible();
  37  |         }
  38  |       } else {
  39  |         // If already logged in, check for main app elements
  40  |         await expect(page.locator('body')).toContainText('Welcome', { timeout: 5000 }).catch(() => {});
  41  |       }
  42  |     });
  43  | 
  44  |     test('should handle race management interface', async ({ page }) => {
  45  |       await page.goto('/');
  46  |       
  47  |       // Try to login if needed
  48  |       const loginForm = page.locator('form');
  49  |       const hasLoginForm = await loginForm.isVisible().catch(() => false);
  50  |       
  51  |       if (hasLoginForm) {
  52  |         await page.locator('input[type="email"], input[name="email"]').fill('test@example.com');
  53  |         await page.locator('input[type="password"], input[name="password"]').fill('password123');
  54  |         await page.locator('button[type="submit"]').click();
  55  |         await page.waitForLoadState('networkidle');
  56  |       }
  57  |       
  58  |       // Look for race management elements
  59  |       const createRaceButton = page.locator('button:has-text("Create Race")');
  60  |       const raceList = page.locator('[data-testid="race-list"]');
  61  |       
  62  |       const hasCreateButton = await createRaceButton.isVisible().catch(() => false);
  63  |       const hasRaceList = await raceList.isVisible().catch(() => false);
  64  |       
  65  |       expect(hasCreateButton || hasRaceList).toBeTruthy();
  66  |       
  67  |       if (hasCreateButton) {
  68  |         await createRaceButton.click();
  69  |         await expect(page.locator('input[name="name"]')).toBeVisible();
  70  |         await expect(page.locator('select[name="type"]')).toBeVisible();
  71  |         await expect(page.locator('textarea[name="description"]')).toBeVisible();
  72  |       }
  73  |     });
  74  | 
  75  |     test('should handle route builder interface', async ({ page }) => {
  76  |       await page.goto('/');
  77  |       
  78  |       // Try to login if needed
  79  |       const loginForm = page.locator('form');
  80  |       const hasLoginForm = await loginForm.isVisible().catch(() => false);
  81  |       
  82  |       if (hasLoginForm) {
  83  |         await page.locator('input[type="email"], input[name="email"]').fill('test@example.com');
  84  |         await page.locator('input[type="password"], input[name="password"]').fill('password123');
  85  |         await page.locator('button[type="submit"]').click();
  86  |         await page.waitForLoadState('networkidle');
  87  |       }
  88  |       
  89  |       // Navigate to race creation
  90  |       const createRaceButton = page.locator('button:has-text("Create Race")');
  91  |       if (await createRaceButton.isVisible().catch(() => false)) {
  92  |         await createRaceButton.click();
  93  |         
  94  |         // Look for route builder elements
  95  |         const routeBuilderButton = page.locator('button:has-text("Create New Route"), button:has-text("Route Builder")');
  96  |         if (await routeBuilderButton.isVisible().catch(() => false)) {
  97  |           await routeBuilderButton.click();
  98  |           
  99  |           // Check for map interface
  100 |           await expect(page.locator('#map, .leaflet-container')).toBeVisible({ timeout: 10000 });
  101 |           
  102 |           // Check for route creation tools
  103 |           const hasRouteTools = await Promise.any([
  104 |             page.locator('button:has-text("Add Start")').isVisible().catch(() => false),
  105 |             page.locator('button:has-text("Add Checkpoint")').isVisible().catch(() => false),
  106 |             page.locator('button:has-text("Add Finish")').isVisible().catch(() => false)
  107 |           ]);
  108 |           
  109 |           expect(hasRouteTools).toBeTruthy();
  110 |         }
  111 |       }
  112 |     });
  113 | 
  114 |     test('should handle admin console interface', async ({ page }) => {
  115 |       await page.goto('/');
  116 |       
  117 |       // Try to login as admin
  118 |       const loginForm = page.locator('form');
  119 |       const hasLoginForm = await loginForm.isVisible().catch(() => false);
  120 |       
  121 |       if (hasLoginForm) {
> 122 |         await page.locator('input[type="email"], input[name="email"]').fill('admin@example.com');
      |                                                                        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  123 |         await page.locator('input[type="password"], input[name="password"]').fill('admin123');
  124 |         await page.locator('button[type="submit"]').click();
  125 |         await page.waitForLoadState('networkidle');
  126 |       }
  127 |       
  128 |       // Look for admin console
  129 |       const adminButton = page.locator('button:has-text("Admin Console"), a:has-text("Admin Console")');
  130 |       const hasAdminButton = await adminButton.isVisible().catch(() => false);
  131 |       
  132 |       if (hasAdminButton) {
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
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: system-integration.spec.ts >> System Integration Tests >> Real-time Features >> should establish WebSocket connection
- Location: tests/e2e/system-integration.spec.ts:239:9

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
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
  144 |       await page.locator('input[name="routeName"]').fill('Test Route');
  145 |       await page.locator('button:has-text("Confirm")').click();
  146 |       
  147 |       // Verify route was created
  148 |       await expect(page.locator('body')).toContainText('Route created successfully', { timeout: 10000 });
  149 |       
  150 |       // Should return to race creation with route selected
  151 |       await expect(page.locator('body')).toContainText('Test Route', { timeout: 5000 });
  152 |     });
  153 | 
  154 |     test('should validate route types', async ({ page }) => {
  155 |       // Navigate to route builder
  156 |       await page.locator('button:has-text("Create Race")').click();
  157 |       await page.locator('button:has-text("Create New Route")').click();
  158 |       
  159 |       // Test different race types
  160 |       await page.locator('select[name="raceType"]').selectOption('sprint');
  161 |       await expect(page.locator('body')).toContainText('Point-to-point race', { timeout: 5000 });
  162 |       
  163 |       await page.locator('select[name="raceType"]').selectOption('circuit');
  164 |       await expect(page.locator('body')).toContainText('Closed loop required', { timeout: 5000 });
  165 |       
  166 |       await page.locator('select[name="raceType"]').selectOption('time-trial');
  167 |       await expect(page.locator('body')).toContainText('Checkpoint registration', { timeout: 5000 });
  168 |     });
  169 |   });
  170 | 
  171 |   test.describe('Admin Console', () => {
  172 |     test.beforeEach(async ({ page }) => {
  173 |       // Login as admin
  174 |       await page.goto('/');
  175 |       await page.locator('input[type="email"]').fill('admin@example.com');
  176 |       await page.locator('input[type="password"]').fill('admin123');
  177 |       await page.locator('button[type="submit"]').click();
  178 |       await page.waitForLoadState('networkidle');
  179 |     });
  180 | 
  181 |     test('should access admin console', async ({ page }) => {
  182 |       // Navigate to admin console
  183 |       await page.locator('button:has-text("Admin Console")').click();
  184 |       
  185 |       // Verify admin dashboard
  186 |       await expect(page.locator('h1:has-text("Race Admin Console")')).toBeVisible({ timeout: 10000 });
  187 |       await expect(page.locator('[data-testid="race-stats"]')).toBeVisible();
  188 |       await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
  189 |       await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
  190 |     });
  191 | 
  192 |     test('should manage races from admin console', async ({ page }) => {
  193 |       await page.locator('button:has-text("Admin Console")').click();
  194 |       
  195 |       // View race management
  196 |       await page.locator('button:has-text("Manage Races")').click();
  197 |       await expect(page.locator('[data-testid="race-list"]')).toBeVisible({ timeout: 5000 });
  198 |       
  199 |       // Test race controls
  200 |       const raceRow = page.locator('[data-testid="race-row"]').first();
  201 |       if (await raceRow.isVisible()) {
  202 |         await raceRow.locator('button:has-text("Control")').click();
  203 |         
  204 |         // Test flag controls
  205 |         await expect(page.locator('button:has-text("Green Flag")')).toBeVisible();
  206 |         await expect(page.locator('button:has-text("Yellow Flag")')).toBeVisible();
  207 |         await expect(page.locator('button:has-text("Red Flag")')).toBeVisible();
  208 |         
  209 |         // Test safety car
  210 |         await expect(page.locator('button:has-text("Deploy Safety Car")')).toBeVisible();
  211 |       }
  212 |     });
  213 | 
  214 |     test('should manage users from admin console', async ({ page }) => {
  215 |       await page.locator('button:has-text("Admin Console")').click();
  216 |       
  217 |       // View user management
  218 |       await page.locator('button:has-text("Manage Users")').click();
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
> 233 |       await page.locator('input[type="email"]').fill('test@example.com');
      |                                                 ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  319 |       await page.locator('input[type="email"]').fill('test@example.com');
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
```
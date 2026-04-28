# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: system-integration.spec.ts >> System Integration Tests >> Admin Console >> should manage races from admin console
- Location: tests/e2e/system-integration.spec.ts:192:9

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
> 175 |       await page.locator('input[type="email"]').fill('admin@example.com');
      |                                                 ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  233 |       await page.locator('input[type="email"]').fill('test@example.com');
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
```
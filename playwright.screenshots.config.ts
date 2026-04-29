import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration specifically for generating app screenshots
 */
export default defineConfig({
  testDir: './screenshots',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0, // No retries for screenshots
  workers: 1, // Run sequentially for consistent screenshots
  
  use: {
    baseURL: 'http://localhost:5173', // Vite dev server
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    // Desktop screenshots
    {
      name: 'desktop-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    // Mobile screenshots
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
      },
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  // Start dev server before taking screenshots
  webServer: {
    command: 'npm run dev:client',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});

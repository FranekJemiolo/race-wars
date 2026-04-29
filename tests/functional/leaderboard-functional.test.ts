/**
 * Functional Tests for Leaderboard Features
 * 
 * Tests specific leaderboard functionality from a user perspective,
 * including race management, position tracking, and real-time updates
 */

import { test, expect } from '@playwright/test';

test.describe('Leaderboard Functional Tests', () => {
  let authToken: string;
  let raceId: string;

  test.beforeAll(async () => {
    // Set up test data
    raceId = 'test-functional-race';
  });

  test.beforeEach(async ({ page }) => {
    // Perform proper login
    await page.goto('/');
    
    // Wait for auth screen to load
    await page.waitForSelector('input[name="username"]');
    
    // Fill in login credentials
    await page.fill('input[name="username"]', 'testdriver');
    await page.fill('input[name="password"]', 'driver123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for successful login - check if we're no longer on auth screen
    await page.waitForSelector('input[name="username"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // Get auth token from localStorage
    authToken = await page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
  });

  test.describe('Race Lifecycle Management', () => {
    test('should create and initialize a new race leaderboard', async ({ page }) => {
      // Navigate to race creation page
      await page.goto('/races/create');
      
      // Fill in race details
      await page.fill('[data-testid="race-name"]', 'Functional Test Race');
      await page.selectOption('[data-testid="race-type"]', 'circuit');
      await page.fill('[data-testid="track-name"]', 'Test Circuit');
      await page.fill('[data-testid="max-participants"]', '10');
      
      // Create race
      await page.click('[data-testid="create-race-button"]');
      
      // Wait for race creation and redirect
      await page.waitForURL(/\/races\/[^\/]+/);
      
      // Initialize leaderboard
      await page.click('[data-testid="initialize-leaderboard-button"]');
      
      // Verify leaderboard is initialized
      await expect(page.locator('[data-testid="leaderboard-status"]')).toContainText('Active');
      await expect(page.locator('[data-testid="participant-count"]')).toContainText('0');
    });

    test('should start a race and begin tracking positions', async ({ page }) => {
      // Navigate to existing race
      await page.goto(`/races/${raceId}`);
      
      // Initialize leaderboard if not already done
      if (await page.locator('[data-testid="initialize-leaderboard-button"]').isVisible()) {
        await page.click('[data-testid="initialize-leaderboard-button"]');
        await page.waitForSelector('[data-testid="start-race-button"]');
      }
      
      // Start the race
      await page.click('[data-testid="start-race-button"]');
      
      // Verify race is started
      await expect(page.locator('[data-testid="race-status"]')).toContainText('In Progress');
      await expect(page.locator('[data-testid="race-timer"]')).toBeVisible();
      await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    });

    test('should finish a race and display final results', async ({ page }) => {
      // Navigate to race
      await page.goto(`/races/${raceId}`);
      
      // Ensure race is in progress
      if (await page.locator('[data-testid="start-race-button"]').isVisible()) {
        await page.click('[data-testid="start-race-button"]');
      }
      
      // Finish the race
      await page.click('[data-testid="finish-race-button"]');
      
      // Confirm finish
      await page.click('[data-testid="confirm-finish-button"]');
      
      // Verify race is finished
      await expect(page.locator('[data-testid="race-status"]')).toContainText('Finished');
      await expect(page.locator('[data-testid="final-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="podium-display"]')).toBeVisible();
    });
  });

  test.describe('Participant Management', () => {
    test('should add participants to the leaderboard', async ({ page }) => {
      // Navigate to race management
      await page.goto(`/races/${raceId}/manage`);
      
      // Add first participant
      await page.click('[data-testid="add-participant-button"]');
      await page.fill('[data-testid="participant-name"]', 'Driver One');
      await page.fill('[data-testid="participant-car"]', 'Ferrari F1-75');
      await page.fill('[data-testid="car-number"]', '1');
      await page.click('[data-testid="save-participant-button"]');
      
      // Add second participant
      await page.click('[data-testid="add-participant-button"]');
      await page.fill('[data-testid="participant-name"]', 'Driver Two');
      await page.fill('[data-testid="participant-car"]', 'Red Bull RB18');
      await page.fill('[data-testid="car-number"]', '2');
      await page.click('[data-testid="save-participant-button"]');
      
      // Verify participants are added
      await expect(page.locator('[data-testid="participant-list"]')).toHaveCount(2);
      await expect(page.locator('[data-testid="participant-item"]:first-child')).toContainText('Driver One');
      await expect(page.locator('[data-testid="participant-item"]:nth-child(2)')).toContainText('Driver Two');
    });

    test('should remove participants from the leaderboard', async ({ page }) => {
      // Navigate to race management
      await page.goto(`/races/${raceId}/manage`);
      
      // Remove a participant
      await page.hover('[data-testid="participant-item"]:first-child');
      await page.click('[data-testid="remove-participant-button"]');
      await page.click('[data-testid="confirm-remove-button"]');
      
      // Verify participant is removed
      await expect(page.locator('[data-testid="participant-list"]')).toHaveCount(1);
    });

    test('should update participant information', async ({ page }) => {
      // Navigate to race management
      await page.goto(`/races/${raceId}/manage`);
      
      // Edit participant
      await page.hover('[data-testid="participant-item"]:first-child');
      await page.click('[data-testid="edit-participant-button"]');
      
      // Update participant details
      await page.fill('[data-testid="participant-name"]', 'Updated Driver Name');
      await page.fill('[data-testid="car-number"]', '99');
      await page.click('[data-testid="save-participant-button"]');
      
      // Verify participant is updated
      await expect(page.locator('[data-testid="participant-item"]:first-child')).toContainText('Updated Driver Name');
      await expect(page.locator('[data-testid="participant-item"]:first-child')).toContainText('#99');
    });
  });

  test.describe('Position Tracking', () => {
    test('should track position changes during the race', async ({ page }) => {
      // Navigate to race leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Start race if not already started
      if (await page.locator('[data-testid="start-race-button"]').isVisible()) {
        await page.click('[data-testid="start-race-button"]');
      }
      
      // Simulate position update
      await page.evaluate(() => {
        // Simulate WebSocket message for position update
        const event = new CustomEvent('leaderboardUpdate', {
          detail: {
            type: 'position_update',
            data: {
              participantId: 'participant-1',
              position: 1,
              lap: 3,
              lapTime: 65000,
              totalTime: 195000,
              gapToLeader: 0,
              status: 'racing'
            }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Verify position update is reflected
      await expect(page.locator('[data-testid="position-cell"]:first-child')).toContainText('1');
      await expect(page.locator('[data-testid="lap-cell"]:first-child')).toContainText('3');
    });

    test('should handle lap counting correctly', async ({ page }) => {
      // Navigate to race leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Simulate lap completion
      await page.evaluate(() => {
        const event = new CustomEvent('leaderboardUpdate', {
          detail: {
            type: 'lap_completed',
            data: {
              participantId: 'participant-1',
              currentLap: 2,
              totalLaps: 5,
              lapTime: 62000,
              bestLapTime: 62000
            }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Verify lap count is updated
      await expect(page.locator('[data-testid="lap-cell"]:first-child')).toContainText('2');
      await expect(page.locator('[data-testid="lap-time-cell"]:first-child')).toContainText('1:02.0');
    });

    test('should track pit stops and status changes', async ({ page }) => {
      // Navigate to race leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Simulate pit stop
      await page.evaluate(() => {
        const event = new CustomEvent('leaderboardUpdate', {
          detail: {
            type: 'status_change',
            data: {
              participantId: 'participant-1',
              status: 'pit',
              pitStopTime: 2500
            }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Verify status change
      await expect(page.locator('[data-testid="status-cell"]:first-child')).toContainText('PIT');
      await expect(page.locator('[data-testid="pit-indicator"]')).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('should display real-time position changes', async ({ page }) => {
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Start race
      if (await page.locator('[data-testid="start-race-button"]').isVisible()) {
        await page.click('[data-testid="start-race-button"]');
      }
      
      // Get initial positions
      const initialFirstPosition = await page.locator('[data-testid="position-cell"]:first-child').textContent();
      
      // Simulate position swap
      await page.evaluate(() => {
        const event = new CustomEvent('leaderboardUpdate', {
          detail: {
            type: 'leaderboard_update',
            data: {
              entries: [
                {
                  id: 'participant-1',
                  currentPosition: 2,
                  previousPosition: 1,
                  username: 'Driver One',
                  status: 'racing'
                },
                {
                  id: 'participant-2',
                  currentPosition: 1,
                  previousPosition: 2,
                  username: 'Driver Two',
                  status: 'racing'
                }
              ]
            }
          }
        });
        window.dispatchEvent(event);
      });
      
      // Verify position swap
      await expect(page.locator('[data-testid="position-cell"]:first-child')).not.toContainText(initialFirstPosition);
      await expect(page.locator('[data-testid="position-change-indicator"]')).toBeVisible();
    });

    test('should show connection status for real-time updates', async ({ page }) => {
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Check connection status indicator
      await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
      
      // Simulate connection loss
      await page.evaluate(() => {
        const event = new CustomEvent('connectionStatus', {
          detail: { connected: false }
        });
        window.dispatchEvent(event);
      });
      
      // Verify disconnected status
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Disconnected');
      await expect(page.locator('[data-testid="reconnect-button"]')).toBeVisible();
    });
  });

  test.describe('Statistics and Analytics', () => {
    test('should display race statistics', async ({ page }) => {
      // Navigate to race statistics
      await page.goto(`/races/${raceId}/statistics`);
      
      // Check statistics sections
      await expect(page.locator('[data-testid="race-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="participant-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="lap-times"]')).toBeVisible();
      await expect(page.locator('[data-testid="speed-analysis"]')).toBeVisible();
      
      // Verify key statistics
      await expect(page.locator('[data-testid="total-participants"]')).toBeVisible();
      await expect(page.locator('[data-testid="finished-participants"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-lap-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="fastest-lap-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="top-speed"]')).toBeVisible();
    });

    test('should show participant performance metrics', async ({ page }) => {
      // Navigate to participant details
      await page.goto(`/races/${raceId}/participants/participant-1`);
      
      // Check performance metrics
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="lap-time-history"]')).toBeVisible();
      await expect(page.locator('[data-testid="sector-times"]')).toBeVisible();
      await expect(page.locator('[data-testid="speed-trace"]')).toBeVisible();
      
      // Verify specific metrics
      await expect(page.locator('[data-testid="best-lap-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-speed"]')).toBeVisible();
      await expect(page.locator('[data-testid="consistency-score"]')).toBeVisible();
    });

    test('should provide comparison tools', async ({ page }) => {
      // Navigate to comparison page
      await page.goto(`/races/${raceId}/compare`);
      
      // Select participants to compare
      await page.click('[data-testid="select-participant-1"]');
      await page.click('[data-testid="select-participant-2"]');
      
      // Check comparison results
      await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="lap-comparison"]')).toBeVisible();
      await expect(page.locator('[data-testid="position-battle"]')).toBeVisible();
    });
  });

  test.describe('Export and Sharing', () => {
    test('should export leaderboard data', async ({ page }) => {
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Click export button
      await page.click('[data-testid="export-button"]');
      
      // Check export options
      await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-csv"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-json"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible();
      
      // Test CSV export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/leaderboard.*\.csv$/);
    });

    test('should share leaderboard results', async ({ page }) => {
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Click share button
      await page.click('[data-testid="share-button"]');
      
      // Check share options
      await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="share-link"]')).toBeVisible();
      await expect(page.locator('[data-testid="copy-link-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="share-social"]')).toBeVisible();
      
      // Copy link
      await page.click('[data-testid="copy-link-button"]');
      await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Check mobile layout
      await expect(page.locator('[data-testid="mobile-leaderboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-participant-card"]')).toBeVisible();
      
      // Test mobile interactions
      await page.tap('[data-testid="mobile-participant-card"]:first-child');
      await expect(page.locator('[data-testid="participant-details"]')).toBeVisible();
    });

    test('should adapt to tablet screens', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Check tablet layout
      await expect(page.locator('[data-testid="tablet-leaderboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="compact-table"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Navigate through leaderboard
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Check ARIA labels
      await expect(page.locator('[data-testid="leaderboard-table"]')).toHaveAttribute('role', 'table');
      await expect(page.locator('[data-testid="position-header"]')).toHaveAttribute('aria-label', 'Position');
      await expect(page.locator('[data-testid="driver-header"]')).toHaveAttribute('aria-label', 'Driver name');
      
      // Check screen reader support
      await expect(page.locator('[data-testid="sr-only-announcements"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Navigate to leaderboard
      await page.goto(`/races/${raceId}/leaderboard`);
      
      // Simulate network error
      await page.route('/api/leaderboard/**', route => {
        route.abort('failed');
      });
      
      // Check error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Test retry
      await page.unroute('/api/leaderboard/**');
      await page.click('[data-testid="retry-button"]');
      
      // Verify recovery
      await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    });

    test('should handle invalid race IDs', async ({ page }) => {
      // Navigate to non-existent race
      await page.goto('/races/non-existent-race/leaderboard');
      
      // Check error handling
      await expect(page.locator('[data-testid="not-found-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="back-to-races"]')).toBeVisible();
    });
  });
});

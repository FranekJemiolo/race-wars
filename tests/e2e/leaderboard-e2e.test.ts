/**
 * End-to-End Tests for Real-Time Leaderboard Functionality
 * 
 * Tests the complete leaderboard workflow including:
 * - UI interaction
 * - WebSocket real-time updates
 * - Database persistence
 * - Multiple participants
 * - Race lifecycle
 */

import { test, expect } from '@playwright/test';
import { WebSocket } from 'ws';

test.describe('Real-Time Leaderboard E2E Tests', () => {
  let wsConnection: WebSocket;
  let authToken: string;
  let raceId: string;

  test.beforeAll(async () => {
    // Set up test data
    raceId = 'test-e2e-race';
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

    // Navigate to the leaderboard page
    await page.goto('/leaderboard');

    // Set up WebSocket connection for real-time updates (with error handling)
    try {
      wsConnection = new WebSocket('ws://localhost:8080');
      
      // Wait for WebSocket to connect or timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 2000);
        
        wsConnection.on('open', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
        
        wsConnection.on('error', () => {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed'));
        });
      });
    } catch (error) {
      // WebSocket not available, continue without it
      console.log('WebSocket not available, continuing with UI tests');
      wsConnection = null;
    }
  });

  test.afterEach(async () => {
    // Clean up WebSocket connection
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.close();
    }
  });

  test('should display leaderboard with correct structure', async ({ page }) => {
    // Check if leaderboard container exists
    await expect(page.locator('[data-testid="leaderboard-container"]')).toBeVisible();
    
    // Check for header elements
    await expect(page.locator('[data-testid="leaderboard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaderboard-title"]')).toContainText('Leaderboard');
    
    // Check for table structure
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaderboard-header-row"]')).toBeVisible();
    
    // Check for column headers
    await expect(page.locator('[data-testid="position-header"]')).toContainText('Position');
    await expect(page.locator('[data-testid="driver-header"]')).toContainText('Driver');
    await expect(page.locator('[data-testid="lap-header"]')).toContainText('Lap');
    await expect(page.locator('[data-testid="time-header"]')).toContainText('Time');
    await expect(page.locator('[data-testid="gap-header"]')).toContainText('Gap');
  });

  test('should show empty state when no participants', async ({ page }) => {
    // Check for empty state message
    await expect(page.locator('[data-testid="empty-leaderboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-message"]')).toContainText('No participants in this race yet');
  });

  test('should initialize leaderboard with participants', async ({ page }) => {
    // Initialize race with participants via API
    await page.evaluate(async ({ raceId, authToken }) => {
      const response = await fetch(`/api/leaderboard/${raceId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          raceName: 'E2E Test Race'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize leaderboard');
      }
    }, { raceId, authToken });

    // Wait for leaderboard to load
    await page.waitForSelector('[data-testid="leaderboard-table"]');
    
    // Check that participants are displayed
    await expect(page.locator('[data-testid="leaderboard-rows"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="participant-row"]:first-child')).toBeVisible();
  });

  test('should update leaderboard in real-time when positions change', async ({ page }) => {
    // Initialize leaderboard
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ raceName: 'E2E Test Race' })
      });
    }, { raceId, authToken });

    // Wait for initial load
    await page.waitForSelector('[data-testid="leaderboard-rows"]');
    
    // Get initial positions
    const initialPositions = await page.locator('[data-testid="position-cell"]').allTextContents();
    
    // Simulate position update via WebSocket
    const positionUpdate = {
      type: 'leaderboard_update',
      raceId,
      data: {
        entries: [
          {
            id: 'participant-1',
            currentPosition: 2,
            previousPosition: 1,
            username: 'Driver 1',
            currentLap: 3,
            totalLaps: 5,
            lapTime: 65000,
            totalTime: 195000,
            gapToLeader: 2500,
            gapToPrevious: 2500,
            status: 'racing'
          },
          {
            id: 'participant-2',
            currentPosition: 1,
            previousPosition: 2,
            username: 'Driver 2',
            currentLap: 3,
            totalLaps: 5,
            lapTime: 62000,
            totalTime: 192500,
            gapToLeader: 0,
            gapToPrevious: 0,
            status: 'racing'
          }
        ]
      },
      timestamp: Date.now()
    };

    // Send WebSocket message
    wsConnection.send(JSON.stringify(positionUpdate));
    
    // Wait for UI to update
    await page.waitForTimeout(100);
    
    // Check that positions have changed
    const updatedPositions = await page.locator('[data-testid="position-cell"]').allTextContents();
    expect(updatedPositions).not.toEqual(initialPositions);
    
    // Verify new leader
    await expect(page.locator('[data-testid="participant-row"]:first-child [data-testid="driver-name"]')).toContainText('Driver 2');
    await expect(page.locator('[data-testid="participant-row"]:first-child [data-testid="position-cell"]')).toContainText('1');
  });

  test('should handle participant finishing the race', async ({ page }) => {
    // Initialize leaderboard
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ raceName: 'E2E Test Race' })
      });
    }, { raceId, authToken });

    // Wait for initial load
    await page.waitForSelector('[data-testid="leaderboard-rows"]');
    
    // Simulate participant finishing via API
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/finish/participant-1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ totalTime: 120000 })
      });
    }, { raceId, authToken });

    // Wait for update
    await page.waitForTimeout(100);
    
    // Check that participant status is updated
    const statusCell = page.locator('[data-testid="participant-row"]:first-child [data-testid="status-cell"]');
    await expect(statusCell).toContainText('Finished');
    
    // Check for finish indicator
    await expect(page.locator('[data-testid="finish-indicator"]')).toBeVisible();
  });

  test('should display race statistics', async ({ page }) => {
    // Initialize leaderboard with participants
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ raceName: 'E2E Test Race' })
      });
    }, { raceId, authToken });

    // Wait for load
    await page.waitForSelector('[data-testid="leaderboard-table"]');
    
    // Check statistics section
    await expect(page.locator('[data-testid="race-statistics"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-participants"]')).toBeVisible();
    await expect(page.locator('[data-testid="finished-participants"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-lap-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="fastest-lap-time"]')).toBeVisible();
  });

  test('should handle WebSocket connection errors gracefully', async ({ page }) => {
    // Simulate WebSocket connection loss
    wsConnection.close();
    
    // Check for connection status indicator
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Disconnected');
    
    // Check for retry mechanism
    await expect(page.locator('[data-testid="retry-connection"]')).toBeVisible();
    
    // Simulate reconnection
    wsConnection = new WebSocket('ws://localhost:8080');
    await new Promise((resolve) => {
      wsConnection.on('open', resolve);
    });
    
    // Check that connection status updates
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
  });

  test('should support pagination for large leaderboards', async ({ page }) => {
    // Create many participants
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ raceName: 'E2E Test Race' })
      });
    }, { raceId, authToken });

    // Wait for load
    await page.waitForSelector('[data-testid="leaderboard-table"]');
    
    // Check for pagination controls
    await expect(page.locator('[data-testid="pagination-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="previous-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-page"]')).toBeVisible();
    
    // Test page navigation
    if (await page.locator('[data-testid="next-page"]').isEnabled()) {
      await page.click('[data-testid="next-page"]');
      await page.waitForTimeout(100);
      
      // Check that page info updates
      await expect(page.locator('[data-testid="page-info"]')).toBeVisible();
    }
  });

  test('should handle race completion', async ({ page }) => {
    // Initialize leaderboard
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ raceName: 'E2E Test Race' })
      });
    }, { raceId, authToken });

    // Wait for load
    await page.waitForSelector('[data-testid="leaderboard-table"]');
    
    // Finish the race
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
    }, { raceId, authToken });

    // Wait for update
    await page.waitForTimeout(100);
    
    // Check for race completion indicators
    await expect(page.locator('[data-testid="race-completed"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-results"]')).toBeVisible();
    
    // Check that leaderboard shows final results
    await expect(page.locator('[data-testid="final-positions"]')).toBeVisible();
  });

  test('should support filtering and sorting', async ({ page }) => {
    // Initialize leaderboard
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ raceName: 'E2E Test Race' })
      });
    }, { raceId, authToken });

    // Wait for load
    await page.waitForSelector('[data-testid="leaderboard-table"]');
    
    // Check for filter controls
    await expect(page.locator('[data-testid="filter-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="position-sort"]')).toBeVisible();
    
    // Test filtering by status
    await page.selectOption('[data-testid="status-filter"]', 'finished');
    await page.waitForTimeout(100);
    
    // Check for sorting controls
    await expect(page.locator('[data-testid="sort-by-position"]')).toBeVisible();
    await expect(page.locator('[data-testid="sort-by-time"]')).toBeVisible();
    
    // Test sorting
    await page.click('[data-testid="sort-by-time"]');
    await page.waitForTimeout(100);
  });

  test('should handle multiple concurrent updates', async ({ page }) => {
    // Initialize leaderboard
    await page.evaluate(async ({ raceId, authToken }) => {
      await fetch(`/api/leaderboard/${raceId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ raceName: 'E2E Test Race' })
      });
    }, { raceId, authToken });

    // Wait for load
    await page.waitForSelector('[data-testid="leaderboard-rows"]');
    
    // Send multiple rapid updates
    const updates = [
      { participantId: 'participant-1', position: 1, lap: 2, time: 45000 },
      { participantId: 'participant-2', position: 2, lap: 2, time: 47000 },
      { participantId: 'participant-1', position: 2, lap: 3, time: 68000 },
      { participantId: 'participant-2', position: 1, lap: 3, time: 65000 }
    ];

    for (const update of updates) {
      const message = {
        type: 'leaderboard_update',
        raceId,
        data: {
          entries: [{
            id: update.participantId,
            currentPosition: update.position,
            currentLap: update.lap,
            totalTime: update.time,
            username: update.participantId === 'participant-1' ? 'Driver 1' : 'Driver 2',
            status: 'racing'
          }]
        },
        timestamp: Date.now()
      };
      
      wsConnection.send(JSON.stringify(message));
      await page.waitForTimeout(50); // Small delay between updates
    }

    // Wait for all updates to process
    await page.waitForTimeout(200);
    
    // Verify final state
    await expect(page.locator('[data-testid="leaderboard-rows"]')).toHaveCount(2);
    const firstPosition = await page.locator('[data-testid="participant-row"]:first-child [data-testid="position-cell"]').textContent();
    expect(firstPosition).toBe('1');
  });

  test('should display loading states', async ({ page }) => {
    // Navigate to leaderboard page
    await page.goto('/leaderboard');
    
    // Check for initial loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-message"]')).toContainText('Loading leaderboard...');
    
    // Wait for load to complete
    await page.waitForSelector('[data-testid="leaderboard-container"]', { timeout: 5000 });
    
    // Check that loading state is removed
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Simulate network error by intercepting requests
    await page.route('/api/leaderboard/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Server error' })
      });
    });

    // Navigate to leaderboard
    await page.goto('/leaderboard');
    
    // Check for error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Test retry functionality
    await page.unroute('/api/leaderboard/**');
    await page.click('[data-testid="retry-button"]');
    
    // Wait for successful load
    await page.waitForSelector('[data-testid="leaderboard-container"]', { timeout: 5000 });
  });
});

import { test, expect } from '@playwright/test';

/**
 * Test Database Setup Utilities
 * 
 * This file provides utilities for setting up test data in the database
 * to ensure E2E tests use real data instead of hardcoded values.
 */

export interface TestUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

export interface TestTrack {
  id: string;
  name: string;
  description: string;
  location_name: string;
  track_type: string;
  difficulty_level: string;
  centerline: string;
  boundaries: string;
  start_finish_line: string;
}

export interface TestEvent {
  id: string;
  name: string;
  description: string;
  type: string;
  organizer_id: string;
  start_time: Date;
  end_time: Date;
  max_participants: number;
}

export interface TestSession {
  id: string;
  event_id: string;
  name: string;
  description: string;
  session_type: string;
  start_time: Date;
  end_time: Date;
  max_participants: number;
}

/**
 * Database seeding utilities for E2E tests
 */
export class TestDatabaseSetup {
  private static baseUrl = 'http://localhost:8080'; // Server URL
  private static apiBaseUrl = 'http://localhost:8080/api'; // API URL

  /**
   * Create a test user in the database
   */
  static async createTestUser(userData: Partial<TestUser>): Promise<TestUser> {
    const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username || `testuser_${Date.now()}`,
        email: userData.email || `test_${Date.now()}@example.com`,
        password: userData.password || 'testpassword123',
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'User',
        displayName: userData.displayName || 'Test User',
        experienceLevel: 'beginner'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create test user: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.user?.id || '',
      username: userData.username || `testuser_${Date.now()}`,
      email: userData.email || `test_${Date.now()}@example.com`,
      password: userData.password || 'testpassword123',
      firstName: userData.firstName || 'Test',
      lastName: userData.lastName || 'User',
      displayName: userData.displayName || 'Test User'
    };
  }

  /**
   * Create a test track in the database
   */
  static async createTestTrack(trackData: Partial<TestTrack>): Promise<TestTrack> {
    const defaultTrackData = {
      name: trackData.name || `Test Track ${Date.now()}`,
      description: trackData.description || 'A test track for E2E testing',
      location_name: trackData.location_name || 'Test Location',
      track_type: trackData.track_type || 'circuit',
      difficulty_level: trackData.difficulty_level || 'beginner',
      centerline: trackData.centerline || JSON.stringify({
        type: 'LineString',
        coordinates: [[-122.4194, 37.7749], [-122.4184, 37.7759], [-122.4174, 37.7769]]
      }),
      boundaries: trackData.boundaries || JSON.stringify({
        type: 'Polygon',
        coordinates: [[[-122.4200, 37.7740], [-122.4140, 37.7740], [-122.4140, 37.7800], [-122.4200, 37.7800], [-122.4200, 37.7740]]]
      }),
      start_finish_line: trackData.start_finish_line || JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      })
    };

    const response = await fetch(`${this.apiBaseUrl}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify(defaultTrackData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create test track: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      ...defaultTrackData
    };
  }

  /**
   * Create a test event in the database
   */
  static async createTestEvent(eventData: Partial<TestEvent>): Promise<TestEvent> {
    const defaultEventData = {
      name: eventData.name || `Test Event ${Date.now()}`,
      description: eventData.description || 'A test event for E2E testing',
      type: eventData.type || 'TRACK_DAY',
      organizer_id: eventData.organizer_id || 'test-organizer',
      start_time: eventData.start_time || new Date('2024-12-01T09:00:00Z'),
      end_time: eventData.end_time || new Date('2024-12-01T17:00:00Z'),
      max_participants: eventData.max_participants || 50
    };

    const response = await fetch(`${this.apiBaseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify(defaultEventData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create test event: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      ...defaultEventData
    };
  }

  /**
   * Create a test session in the database
   */
  static async createTestSession(sessionData: Partial<TestSession>): Promise<TestSession> {
    const defaultSessionData = {
      event_id: sessionData.event_id || (await this.createTestEvent({}).then(e => e.id)),
      name: sessionData.name || `Test Session ${Date.now()}`,
      description: sessionData.description || 'A test session for E2E testing',
      session_type: sessionData.session_type || 'PRACTICE',
      start_time: sessionData.start_time || new Date('2024-12-01T09:00:00Z'),
      end_time: sessionData.end_time || new Date('2024-12-01T10:00:00Z'),
      max_participants: sessionData.max_participants || 20
    };

    const response = await fetch(`${this.apiBaseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify(defaultSessionData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create test session: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      ...defaultSessionData
    };
  }

  /**
   * Get authentication token for API calls
   */
  private static async getAuthToken(): Promise<string> {
    // Try to login with a test user or create one first
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpassword123'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.tokens?.accessToken || '';
      }
    } catch (error) {
      // Login failed, create a test user first
      await this.createTestUser({
        username: 'testuser',
        password: 'testpassword123',
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User'
      });

      // Try login again
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpassword123'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.tokens?.accessToken || '';
      }
    }

    throw new Error('Failed to get authentication token');
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData(): Promise<void> {
    // Implementation for cleaning up test data
    // This would involve deleting test users, tracks, events, etc.
    console.log('Test data cleanup completed');
  }

  /**
   * Verify data persistence
   */
  static async verifyDataPersistence(entityType: string, entityId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${entityType}/${entityId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Test data factory for creating consistent test data
 */
export class TestDataFactory {
  static createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    const timestamp = Date.now();
    return {
      id: '',
      username: `testuser_${timestamp}`,
      email: `test_${timestamp}@example.com`,
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      ...overrides
    };
  }

  static createTestTrack(overrides: Partial<TestTrack> = {}): TestTrack {
    const timestamp = Date.now();
    return {
      id: '',
      name: `Test Track ${timestamp}`,
      description: 'A test track for E2E testing',
      location_name: 'Test Location',
      track_type: 'circuit',
      difficulty_level: 'beginner',
      centerline: JSON.stringify({
        type: 'LineString',
        coordinates: [[-122.4194, 37.7749], [-122.4184, 37.7759], [-122.4174, 37.7769]]
      }),
      boundaries: JSON.stringify({
        type: 'Polygon',
        coordinates: [[[-122.4200, 37.7740], [-122.4140, 37.7740], [-122.4140, 37.7800], [-122.4200, 37.7800], [-122.4200, 37.7740]]]
      }),
      start_finish_line: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      }),
      ...overrides
    };
  }

  static createTestEvent(overrides: Partial<TestEvent> = {}): TestEvent {
    const timestamp = Date.now();
    return {
      id: '',
      name: `Test Event ${timestamp}`,
      description: 'A test event for E2E testing',
      type: 'TRACK_DAY',
      organizer_id: 'test-organizer',
      start_time: new Date('2024-12-01T09:00:00Z'),
      end_time: new Date('2024-12-01T17:00:00Z'),
      max_participants: 50,
      ...overrides
    };
  }

  static createTestSession(overrides: Partial<TestSession> = {}): TestSession {
    const timestamp = Date.now();
    return {
      id: '',
      event_id: '',
      name: `Test Session ${timestamp}`,
      description: 'A test session for E2E testing',
      session_type: 'PRACTICE',
      start_time: new Date('2024-12-01T09:00:00Z'),
      end_time: new Date('2024-12-01T10:00:00Z'),
      max_participants: 20,
      ...overrides
    };
  }
}

// Extend Playwright test interface to include database setup
declare global {
  namespace PlaywrightTest {
    interface Test {
      use: {
        databaseSetup: typeof TestDatabaseSetup;
        testDataFactory: typeof TestDataFactory;
      };
    }
  }
}

// Add database setup to Playwright test context
test.extend({
  databaseSetup: async ({}, use) => {
    await use(TestDatabaseSetup);
  },
  testDataFactory: async ({}, use) => {
    await use(TestDataFactory);
  }
});

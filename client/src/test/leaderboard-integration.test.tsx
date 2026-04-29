import { describe, it, expect, beforeEach, jest } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Simple integration test to verify leaderboard components work
describe('Leaderboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render RealTimeLeaderboard component without crashing', () => {
    // Mock WebSocket
    global.WebSocket = class MockWebSocket extends EventTarget {
      readyState = 1;
      send = jest.fn();
      close = jest.fn();
      addEventListener = jest.fn();
      constructor(url: string) {
        super();
      }
    } as any;

    // Dynamic import to avoid module resolution issues
    const { RealTimeLeaderboard } = require('../components/RealTimeLeaderboard');
    
    expect(() => {
      render(React.createElement(RealTimeLeaderboard, { 
        raceId: 'test-race',
        showAntiCheat: true,
        maxEntries: 5
      }));
    }).not.toThrow();
    
    expect(screen.getByText('Live Leaderboard')).toBeInTheDocument();
  });

  it('should have proper component structure', () => {
    global.WebSocket = class MockWebSocket extends EventTarget {
      readyState = 1;
      send = jest.fn();
      close = jest.fn();
      addEventListener = jest.fn();
      constructor(url: string) {
        super();
      }
    } as any;

    const { RealTimeLeaderboard } = require('../components/RealTimeLeaderboard');
    
    render(React.createElement(RealTimeLeaderboard, { 
      raceId: 'test-race'
    }));
    
    // Check for key elements
    expect(screen.getByText('Live Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Pos')).toBeInTheDocument();
    expect(screen.getByText('Driver')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('should handle sorting changes', () => {
    global.WebSocket = class MockWebSocket extends EventTarget {
      readyState = 1;
      send = jest.fn();
      close = jest.fn();
      addEventListener = jest.fn();
      constructor(url: string) {
        super();
      }
    } as any;

    const { RealTimeLeaderboard } = require('../components/RealTimeLeaderboard');
    
    render(React.createElement(RealTimeLeaderboard, { 
      raceId: 'test-race'
    }));
    
    const sortSelect = screen.getByDisplayValue('Position');
    expect(sortSelect).toBeInTheDocument();
    
    // Should be able to change sort option
    expect(() => {
      fireEvent.change(sortSelect, { target: { value: 'speed' } });
    }).not.toThrow();
  });
});

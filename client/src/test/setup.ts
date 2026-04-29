import '@testing-library/jest-dom';

// Mock WebSocket
global.WebSocket = class MockWebSocket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  url = '';
  protocol = '';
  extensions = '';
  bufferedAmount = 0;
  binaryType = 'blob';
  send = jest.fn();
  close = jest.fn();
  ping = jest.fn();
  pong = jest.fn();

  constructor(url: string) {
    super();
    this.url = url;
  }
} as any;

// Mock timers
jest.useFakeTimers();

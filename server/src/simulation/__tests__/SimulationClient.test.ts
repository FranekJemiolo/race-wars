import { SimulationClient, SimulationConfig, RoutePoint } from '../SimulationClient';

describe('SimulationClient', () => {
  let mockWs: any;
  let client: SimulationClient;
  let config: SimulationConfig;

  beforeEach(() => {
    // Mock WebSocket
    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    };

    jest.spyOn(require('ws'), 'WebSocket').mockImplementation(() => mockWs);

    config = {
      clientId: 'test-client-1',
      sessionId: 'test-session',
      serverUrl: 'ws://localhost:8080',
      behavior: 'honest',
      updateInterval: 1000,
      route: [
        { lat: 37.7749, lng: -122.4194, order: 0 },
        { lat: 37.7750, lng: -122.4195, order: 1 },
      ],
    };

    client = new SimulationClient(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should create client with config', () => {
    expect(client).toBeDefined();
  });

  test('should connect to server', async () => {
    mockWs.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'open') {
        setTimeout(() => callback(), 0);
      }
    });

    await client.connect();
    expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
  });

  test('should send join message on connection', async () => {
    mockWs.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'open') {
        setTimeout(() => callback(), 0);
      }
    });

    await client.connect();
    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'join_session',
        sessionId: config.sessionId,
        clientId: config.clientId,
      })
    );
  });

  test('should calculate heading between points', () => {
    const point1: RoutePoint = { lat: 37.7749, lng: -122.4194, order: 0 };
    const point2: RoutePoint = { lat: 37.7750, lng: -122.4195, order: 1 };

    const client = new SimulationClient(config);
    // Access private method through reflection for testing
    const heading = (client as any).calculateHeading(point1, point2);

    expect(heading).toBeGreaterThanOrEqual(0);
    expect(heading).toBeLessThan(360);
  });

  test('should calculate distance between points', () => {
    const point1: RoutePoint = { lat: 37.7749, lng: -122.4194, order: 0 };
    const point2: RoutePoint = { lat: 37.7750, lng: -122.4195, order: 1 };

    const client = new SimulationClient(config);
    const distance = (client as any).calculateDistance(
      point1.lat,
      point1.lng,
      point2.lat,
      point2.lng
    );

    expect(distance).toBeGreaterThan(0);
  });

  test('should calculate speed between points', () => {
    const point1: RoutePoint = { lat: 37.7749, lng: -122.4194, order: 0 };
    const point2: RoutePoint = { lat: 37.7750, lng: -122.4195, order: 1 };

    const client = new SimulationClient(config);
    const speed = (client as any).calculateSpeed(point1, point2);

    expect(speed).toBeGreaterThan(0);
  });

  test('should disconnect from server', async () => {
    mockWs.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'open') {
        setTimeout(() => callback(), 0);
      }
    });

    await client.connect();
    client.disconnect();

    expect(mockWs.close).toHaveBeenCalled();
  });

  test('should report connection status', async () => {
    mockWs.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'open') {
        setTimeout(() => callback(), 0);
      }
    });

    await client.connect();
    expect(client.isConnectedToServer()).toBe(true);

    client.disconnect();
    expect(client.isConnectedToServer()).toBe(false);
  });

  test('should handle session started message', async () => {
    mockWs.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'open') {
        setTimeout(() => callback(), 0);
      }
      if (event === 'message') {
        setTimeout(() => callback(JSON.stringify({ type: 'session_started' })), 0);
      }
    });

    await client.connect();
    // Should start simulation when session_started message received
  });

  test('should handle session ended message', async () => {
    mockWs.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'open') {
        setTimeout(() => callback(), 0);
      }
      if (event === 'message') {
        setTimeout(() => callback(JSON.stringify({ type: 'session_ended' })), 0);
      }
    });

    await client.connect();
    // Should stop simulation when session_ended message received
  });
});

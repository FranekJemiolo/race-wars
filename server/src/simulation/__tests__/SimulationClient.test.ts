import { SimulationClient, SimulationConfig, RoutePoint } from '../SimulationClient';

describe('SimulationClient', () => {
  let client: SimulationClient;
  let config: SimulationConfig;

  beforeEach(() => {
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

  test('should create client with config', () => {
    expect(client).toBeDefined();
    expect(client.isConnectedToServer()).toBe(false);
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

  test('should have disconnect method', () => {
    expect(typeof client.disconnect).toBe('function');
    client.disconnect();
    expect(client.isConnectedToServer()).toBe(false);
  });

  test('should have connection status method', () => {
    expect(typeof client.isConnectedToServer).toBe('function');
    expect(client.isConnectedToServer()).toBe(false);
  });

  test('should support different behaviors', () => {
    const behaviors: SimulationConfig['behavior'][] = ['honest', 'cheat_teleport', 'cheat_speed', 'erratic', 'stall'];
    
    behaviors.forEach(behavior => {
      const configWithBehavior = { ...config, behavior };
      const clientWithBehavior = new SimulationClient(configWithBehavior);
      expect(clientWithBehavior).toBeDefined();
    });
  });

  test('should handle empty route', () => {
    const configWithoutRoute = { ...config, route: undefined };
    const clientWithoutRoute = new SimulationClient(configWithoutRoute);
    expect(clientWithoutRoute).toBeDefined();
  });
});

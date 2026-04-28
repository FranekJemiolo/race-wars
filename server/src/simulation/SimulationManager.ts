import { SimulationClient, SimulationConfig, RoutePoint } from './SimulationClient';

export interface SimulationScenario {
  name: string;
  description: string;
  clients: SimulationConfig[];
  duration?: number;
}

export class SimulationManager {
  private clients: Map<string, SimulationClient> = new Map();
  private serverUrl: string;
  private sessionId: string;

  constructor(serverUrl: string, sessionId: string) {
    this.serverUrl = serverUrl;
    this.sessionId = sessionId;
  }

  async addClient(config: SimulationConfig): Promise<void> {
    const client = new SimulationClient({
      ...config,
      serverUrl: this.serverUrl,
      sessionId: this.sessionId,
    });

    await client.connect();
    this.clients.set(config.clientId, client);
    console.log(`Added simulation client: ${config.clientId}`);
  }

  async addMultipleClients(configs: SimulationConfig[]): Promise<void> {
    const promises = configs.map(config => this.addClient(config));
    await Promise.all(promises);
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.disconnect();
      this.clients.delete(clientId);
      console.log(`Removed simulation client: ${clientId}`);
    }
  }

  removeClients(clientIds: string[]): void {
    clientIds.forEach(id => this.removeClient(id));
  }

  removeAllClients(): void {
    this.clients.forEach((client, clientId) => {
      client.disconnect();
    });
    this.clients.clear();
    console.log('Removed all simulation clients');
  }

  getClient(clientId: string): SimulationClient | undefined {
    return this.clients.get(clientId);
  }

  getAllClients(): SimulationClient[] {
    return Array.from(this.clients.values());
  }

  getConnectedClients(): SimulationClient[] {
    return this.getAllClients().filter(client => client.isConnectedToServer());
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getConnectedClientCount(): number {
    return this.getConnectedClients().length;
  }

  async runScenario(scenario: SimulationScenario): Promise<void> {
    console.log(`Running scenario: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`Clients: ${scenario.clients.length}`);

    await this.addMultipleClients(scenario.clients);

    if (scenario.duration) {
      setTimeout(() => {
        console.log(`Scenario ${scenario.name} completed`);
        this.removeAllClients();
      }, scenario.duration);
    }
  }

  async runScenarioWithDuration(scenario: SimulationScenario, duration: number): Promise<void> {
    await this.runScenario({
      ...scenario,
      duration,
    });
  }

  getClientStatus(): Map<string, { connected: boolean; behavior: string }> {
    const status = new Map();
    this.clients.forEach((client, clientId) => {
      status.set(clientId, {
        connected: client.isConnectedToServer(),
        behavior: this.getClientConfig(clientId)?.behavior || 'unknown',
      });
    });
    return status;
  }

  private getClientConfig(clientId: string): SimulationConfig | undefined {
    const client = this.clients.get(clientId);
    if (!client) return undefined;
    // This would need to be stored if we want to retrieve it
    return undefined;
  }

  generateHonestRacers(count: number, route: RoutePoint[]): SimulationConfig[] {
    return Array.from({ length: count }, (_, i) => ({
      clientId: `honest_racer_${i + 1}`,
      sessionId: this.sessionId,
      serverUrl: this.serverUrl,
      behavior: 'honest',
      updateInterval: 1000,
      route,
    }));
  }

  generateSpeedCheaters(count: number, route: RoutePoint[], speedMultiplier: number = 2): SimulationConfig[] {
    return Array.from({ length: count }, (_, i) => ({
      clientId: `speed_cheater_${i + 1}`,
      sessionId: this.sessionId,
      serverUrl: this.serverUrl,
      behavior: 'cheat_speed',
      updateInterval: 1000,
      route,
      speedMultiplier,
    }));
  }

  generateTeleportCheaters(count: number, route: RoutePoint[], teleportChance: number = 0.1): SimulationConfig[] {
    return Array.from({ length: count }, (_, i) => ({
      clientId: `teleport_cheater_${i + 1}`,
      sessionId: this.sessionId,
      serverUrl: this.serverUrl,
      behavior: 'cheat_teleport',
      updateInterval: 1000,
      route,
      teleportChance,
    }));
  }

  generateErraticDrivers(count: number, route: RoutePoint[]): SimulationConfig[] {
    return Array.from({ length: count }, (_, i) => ({
      clientId: `erratic_driver_${i + 1}`,
      sessionId: this.sessionId,
      serverUrl: this.serverUrl,
      behavior: 'erratic',
      updateInterval: 1000,
      route,
    }));
  }

  generateStallingDrivers(count: number, route: RoutePoint[], stallDuration: number = 5000): SimulationConfig[] {
    return Array.from({ length: count }, (_, i) => ({
      clientId: `stalling_driver_${i + 1}`,
      sessionId: this.sessionId,
      serverUrl: this.serverUrl,
      behavior: 'stall',
      updateInterval: 1000,
      route,
      stallDuration,
    }));
  }

  generateMixedScenario(
    honestCount: number,
    cheaterCount: number,
    erraticCount: number,
    route: RoutePoint[],
  ): SimulationConfig[] {
    const configs: SimulationConfig[] = [];
    
    configs.push(...this.generateHonestRacers(honestCount, route));
    configs.push(...this.generateSpeedCheaters(cheaterCount, route));
    configs.push(...this.generateErraticDrivers(erraticCount, route));

    return configs;
  }

  static createCircularRoute(
    centerLat: number,
    centerLng: number,
    radius: number,
    points: number,
  ): RoutePoint[] {
    const route: RoutePoint[] = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const lat = centerLat + (radius / 111) * Math.cos(angle);
      const lng = centerLng + (radius / (111 * Math.cos((centerLat * Math.PI) / 180))) * Math.sin(angle);
      
      route.push({
        lat,
        lng,
        order: i,
      });
    }

    return route;
  }

  static createLinearRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    points: number,
  ): RoutePoint[] {
    const route: RoutePoint[] = [];
    
    for (let i = 0; i < points; i++) {
      const fraction = i / (points - 1);
      const lat = startLat + (endLat - startLat) * fraction;
      const lng = startLng + (endLng - startLng) * fraction;
      
      route.push({
        lat,
        lng,
        order: i,
      });
    }

    return route;
  }

  static createLagunaSecaRoute(): RoutePoint[] {
    // Simplified Laguna Seca track coordinates
    return [
      { lat: 36.5853, lng: -121.7548, order: 0 },
      { lat: 36.5860, lng: -121.7550, order: 1 },
      { lat: 36.5865, lng: -121.7555, order: 2 },
      { lat: 36.5868, lng: -121.7562, order: 3 },
      { lat: 36.5865, lng: -121.7568, order: 4 },
      { lat: 36.5860, lng: -121.7572, order: 5 },
      { lat: 36.5855, lng: -121.7570, order: 6 },
      { lat: 36.5850, lng: -121.7565, order: 7 },
      { lat: 36.5848, lng: -121.7558, order: 8 },
      { lat: 36.5850, lng: -121.7550, order: 9 },
    ];
  }

  static createButtonwillowRoute(): RoutePoint[] {
    // Simplified Buttonwillow track coordinates
    return [
      { lat: 35.4732, lng: -118.8795, order: 0 },
      { lat: 35.4740, lng: -118.8798, order: 1 },
      { lat: 35.4745, lng: -118.8805, order: 2 },
      { lat: 35.4742, lng: -118.8812, order: 3 },
      { lat: 35.4735, lng: -118.8815, order: 4 },
      { lat: 35.4728, lng: -118.8810, order: 5 },
      { lat: 35.4725, lng: -118.8802, order: 6 },
      { lat: 35.4728, lng: -118.8795, order: 7 },
    ];
  }
}

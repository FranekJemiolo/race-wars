import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken('YOUR_MAPBOX_ACCESS_TOKEN');

export interface MapConfig {
  styleURL: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

const DEFAULT_CONFIG: MapConfig = {
  styleURL: MapboxGL.StyleURL.Street,
  center: [0, 0],
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

export class MapService {
  private config: MapConfig;
  private offlinePacks: string[] = [];

  constructor(config?: Partial<MapConfig>) {
    this.config = {...DEFAULT_CONFIG, ...config};
  }

  updateConfig(newConfig: Partial<MapConfig>): void {
    this.config = {...this.config, ...newConfig};
  }

  getConfig(): MapConfig {
    return this.config;
  }

  async downloadOfflinePack(
    name: string,
    bounds: [number, number, number, number],
  ): Promise<void> {
    try {
      const pack = await MapboxGL.offlineManager.createPack(
        {
          name,
          styleURL: this.config.styleURL,
          minZoom: 10,
          maxZoom: 16,
          bounds,
        },
        (progress) => {
          console.log(`Download progress: ${progress.percentage}%`);
        },
      );

      this.offlinePacks.push(name);
      console.log(`Offline pack ${name} downloaded successfully`);
    } catch (error) {
      console.error('Error downloading offline pack:', error);
      throw error;
    }
  }

  async listOfflinePacks(): Promise<any[]> {
    try {
      const packs = await MapboxGL.offlineManager.getPacks();
      return packs;
    } catch (error) {
      console.error('Error listing offline packs:', error);
      return [];
    }
  }

  async deleteOfflinePack(name: string): Promise<void> {
    try {
      await MapboxGL.offlineManager.deletePack(name);
      this.offlinePacks = this.offlinePacks.filter(p => p !== name);
      console.log(`Offline pack ${name} deleted`);
    } catch (error) {
      console.error('Error deleting offline pack:', error);
      throw error;
    }
  }

  async getPackSize(name: string): Promise<number> {
    try {
      const packs = await this.listOfflinePacks();
      const pack = packs.find(p => p.name === name);
      return pack ? pack.metadata.size : 0;
    } catch (error) {
      console.error('Error getting pack size:', error);
      return 0;
    }
  }

  static calculateBounds(
    center: [number, number],
    radiusKm: number,
  ): [number, number, number, number] {
    const lat = center[1];
    const lng = center[0];
    const latDelta = radiusKm / 111; // Approximate km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    return [
      lng - lngDelta,
      lat - latDelta,
      lng + lngDelta,
      lat + latDelta,
    ];
  }

  static async hasOfflineData(
    bounds: [number, number, number, number],
  ): Promise<boolean> {
    try {
      const packs = await MapboxGL.offlineManager.getPacks();
      // Check if any pack covers the requested bounds
      return packs.length > 0;
    } catch (error) {
      return false;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Race Routes Service
 * 
 * Manages predefined race routes based on popular real-world circuits
 * Provides route selection, validation, and track data
 */

export interface TrackPoint {
  lat: number;
  lng: number;
  elevation?: number; // meters above sea level
  sector?: number; // track sector for timing
  checkpoint?: number; // checkpoint number
  isStartFinish?: boolean;
  isPitLane?: boolean;
  speedLimit?: number; // km/h for pit lane or specific sections
  cornerName?: string;
  cornerDifficulty?: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface TrackSector {
  id: number;
  name: string;
  startPoint: number; // index in track points array
  endPoint: number;
  distance: number; // meters
  typicalTime: number; // milliseconds
  characteristics: string[];
}

export interface RaceRoute {
  id: string;
  name: string;
  location: string;
  country: string;
  type: 'street' | 'permanent' | 'hybrid';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  distance: number; // total track length in meters
  laps: number; // default number of laps
  estimatedLapTime: number; // milliseconds
  maxSpeed: number; // km/h
  minSpeed: number; // km/h
  elevationGain: number; // meters
  elevationLoss: number; // meters
  corners: number;
  straights: number;
  drsZones: number[]; // point indices where DRS can be used
  pitLaneSpeedLimit: number; // km/h
  
  // Track layout
  points: TrackPoint[];
  sectors: TrackSector[];
  
  // Track characteristics
  surface: 'asphalt' | 'concrete' | 'mixed';
  width: number; // average track width in meters
  longestStraight: number; // meters
  fastestCorner: string;
  slowestCorner: string;
  
  // Historical data
  lapRecord: {
    time: number;
    driver: string;
    year: number;
    car: string;
  };
  
  // Visual data
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  trackImage?: string;
  
  // Additional info
  description: string;
  features: string[];
  tips: string[];
}

class RaceRoutesService {
  private routes: Map<string, RaceRoute> = new Map();
  private selectedRoute: RaceRoute | null = null;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Monaco Grand Prix - Street Circuit
    const monaco: RaceRoute = {
      id: 'monaco-gp',
      name: 'Monaco Grand Prix',
      location: 'Monte Carlo',
      country: 'Monaco',
      type: 'street',
      difficulty: 'expert',
      distance: 3337, // 3.337 km
      laps: 78,
      estimatedLapTime: 78000, // 1:18.000
      maxSpeed: 285,
      minSpeed: 45,
      elevationGain: 42,
      elevationLoss: 42,
      corners: 19,
      straights: 6,
      drsZones: [15, 45], // Starting straight and tunnel exit
      pitLaneSpeedLimit: 80,
      
      points: this.generateMonacoTrack(),
      sectors: [
        {
          id: 1,
          name: 'Sector 1: Casino Square',
          startPoint: 0,
          endPoint: 12,
          distance: 1080,
          typicalTime: 25000,
          characteristics: ['tight corners', 'elevation changes', 'no room for error']
        },
        {
          id: 2,
          name: 'Sector 2: Tunnel',
          startPoint: 12,
          endPoint: 25,
          distance: 1257,
          typicalTime: 28000,
          characteristics: ['high speed', 'blind exit', 'technical']
        },
        {
          id: 3,
          name: 'Sector 3: Swimming Pool',
          startPoint: 25,
          endPoint: 38,
          distance: 1000,
          typicalTime: 25000,
          characteristics: ['fast chicane', 'precision required', 'barriers']
        }
      ],
      
      surface: 'asphalt',
      width: 12,
      longestStraight: 1050, // Start/finish straight
      fastestCorner: 'Fairmont Hairpin',
      slowestCorner: 'Loews Hairpin',
      
      lapRecord: {
        time: 72448, // 1:12.448
        driver: 'Lewis Hamilton',
        year: 2021,
        car: 'Mercedes W12'
      },
      
      mapCenter: { lat: 43.7347, lng: 7.4216 },
      mapZoom: 16,
      
      description: 'The most prestigious and challenging street circuit in Formula 1, featuring tight corners, elevation changes, and absolutely no margin for error.',
      features: [
        'Elevation changes through Casino Square',
        'Famous tunnel section',
        'Tight hairpins and chicanes',
        'Barrier-lined circuit',
        'No overtaking zones'
      ],
      tips: [
        'Precision is more important than speed',
        'Avoid touching the barriers at all costs',
        'Carry maximum speed through the tunnel',
        'Late braking is key for the hairpins'
      ]
    };

    // Silverstone Circuit - Permanent Circuit
    const silverstone: RaceRoute = {
      id: 'silverstone',
      name: 'Silverstone Circuit',
      location: 'Silverstone',
      country: 'United Kingdom',
      type: 'permanent',
      difficulty: 'medium',
      distance: 5891, // 5.891 km
      laps: 52,
      estimatedLapTime: 87000, // 1:27.000
      maxSpeed: 340,
      minSpeed: 95,
      elevationGain: 35,
      elevationLoss: 35,
      corners: 18,
      straights: 8,
      drsZones: [5, 28, 45], // Wellington Straight, Hangar Straight, start/finish
      pitLaneSpeedLimit: 80,
      
      points: this.generateSilverstoneTrack(),
      sectors: [
        {
          id: 1,
          name: 'Sector 1: Copse Complex',
          startPoint: 0,
          endPoint: 15,
          distance: 2100,
          typicalTime: 32000,
          characteristics: ['high speed', 'flowing corners', 'technical']
        },
        {
          id: 2,
          name: 'Sector 2: Arena',
          startPoint: 15,
          endPoint: 30,
          distance: 1800,
          typicalTime: 28000,
          characteristics: ['medium speed', 'tight complex', 'braking zones']
        },
        {
          id: 3,
          name: 'Sector 3: International',
          startPoint: 30,
          endPoint: 45,
          distance: 1991,
          typicalTime: 27000,
          characteristics: ['fast flowing', 'high speed corners', 'good overtaking']
        }
      ],
      
      surface: 'asphalt',
      width: 15,
      longestStraight: 870, // Hangar Straight
      fastestCorner: 'Copse',
      slowestCorner: 'Luffield',
      
      lapRecord: {
        time: 84412, // 1:24.412
        driver: 'Max Verstappen',
        year: 2020,
        car: 'Red Bull RB16'
      },
      
      mapCenter: { lat: 52.0786, lng: -1.0169 },
      mapZoom: 14,
      
      description: 'The "Home of British Motorsport" - a fast, flowing circuit with high-speed corners and excellent overtaking opportunities.',
      features: [
        'High-speed flowing layout',
        'Multiple DRS zones',
        'Fast corners like Copse and Maggotts/Becketts',
        'Traditional British circuit atmosphere',
        'Good overtaking opportunities'
      ],
      tips: [
        'Carry maximum speed through Maggotts/Becketts complex',
        'Use the full width of the track',
        'Late braking into Stowe and Vale',
        'Strong exit speed from Abbey for the Wellington Straight'
      ]
    };

    // Spa-Francorchamps - Permanent Circuit
    const spa: RaceRoute = {
      id: 'spa-francorchamps',
      name: 'Circuit de Spa-Francorchamps',
      location: 'Spa',
      country: 'Belgium',
      type: 'permanent',
      difficulty: 'hard',
      distance: 7004, // 7.004 km
      laps: 44,
      estimatedLapTime: 105000, // 1:45.000
      maxSpeed: 360,
      minSpeed: 85,
      elevationGain: 105,
      elevationLoss: 105,
      corners: 20,
      straights: 7,
      drsZones: [8, 35], // Kemmel Straight and start/finish
      pitLaneSpeedLimit: 80,
      
      points: this.generateSpaTrack(),
      sectors: [
        {
          id: 1,
          name: 'Sector 1: La Source',
          startPoint: 0,
          endPoint: 18,
          distance: 2500,
          typicalTime: 38000,
          characteristics: ['uphill', 'technical', 'elevation changes']
        },
        {
          id: 2,
          name: 'Sector 2: Kemmel Straight',
          startPoint: 18,
          endPoint: 32,
          distance: 2200,
          typicalTime: 32000,
          characteristics: ['very high speed', 'flat out', 'braking challenge']
        },
        {
          id: 3,
          name: 'Sector 3: Bus Stop',
          startPoint: 32,
          endPoint: 45,
          distance: 2304,
          typicalTime: 35000,
          characteristics: ['technical final sector', 'tight chicane', 'precision']
        }
      ],
      
      surface: 'asphalt',
      width: 14,
      longestStraight: 1800, // Kemmel Straight
      fastestCorner: 'Blanchimont',
      slowestCorner: 'La Source',
      
      lapRecord: {
        time: 101512, // 1:41.512
        driver: 'Valtteri Bottas',
        year: 2018,
        car: 'Mercedes F1 W09 EQ Power+'
      },
      
      mapCenter: { lat: 50.4372, lng: 5.9713 },
      mapZoom: 13,
      
      description: 'The longest circuit on the F1 calendar, featuring dramatic elevation changes, the iconic Eau Rouge, and unpredictable weather.',
      features: [
        'Dramatic elevation changes',
        'Iconic Eau Rouge/Raidillon complex',
        'Long Kemmel Straight for overtaking',
        'Technical final sector',
        'Often unpredictable weather'
      ],
      tips: [
        'Flat out through Eau Rouge if possible',
        'Carry speed through Pouhon and Blanchimont',
        'Late braking for the Bus Stop chicane',
        'Weather conditions can drastically change strategy'
      ]
    };

    // Suzuka Circuit - Figure-8 Layout
    const suzuka: RaceRoute = {
      id: 'suzuka',
      name: 'Suzuka Circuit',
      location: 'Suzuka',
      country: 'Japan',
      type: 'permanent',
      difficulty: 'expert',
      distance: 5807, // 5.807 km
      laps: 53,
      estimatedLapTime: 95000, // 1:35.000
      maxSpeed: 325,
      minSpeed: 90,
      elevationGain: 45,
      elevationLoss: 45,
      corners: 18,
      straights: 6,
      drsZones: [12, 38], // Main straight and start/finish
      pitLaneSpeedLimit: 80,
      
      points: this.generateSuzukaTrack(),
      sectors: [
        {
          id: 1,
          name: 'Sector 1: Esses',
          startPoint: 0,
          endPoint: 15,
          distance: 2000,
          typicalTime: 31000,
          characteristics: ['high speed', 'technical', 'figure-8 crossing']
        },
        {
          id: 2,
          name: 'Sector 2: Degner',
          startPoint: 15,
          endPoint: 30,
          distance: 1900,
          typicalTime: 30000,
          characteristics: ['medium speed', 'tight corners', 'braking zones']
        },
        {
          id: 3,
          name: 'Sector 3: 130R',
          startPoint: 30,
          endPoint: 45,
          distance: 1907,
          typicalTime: 34000,
          characteristics: ['high speed corners', 'challenging final chicane']
        }
      ],
      
      surface: 'asphalt',
      width: 13,
      longestStraight: 1300, // Main straight
      fastestCorner: '130R',
      slowestCorner: 'Casio Triangle',
      
      lapRecord: {
        time: 90512, // 1:30.512
        driver: 'Lewis Hamilton',
        year: 2019,
        car: 'Mercedes F1 W10 EQ Power+'
      },
      
      mapCenter: { lat: 34.8432, lng: 136.5361 },
      mapZoom: 14,
      
      description: 'A unique figure-8 layout that tests both driver skill and car balance, featuring the legendary 130R corner and challenging technical sections.',
      features: [
        'Unique figure-8 layout',
        'High-speed 130R corner',
        'Technical Degner curves',
        'Demanding Casio Triangle chicane',
        'Crossing bridge section'
      ],
      tips: [
        'Flat out through 130R with confidence',
        'Precision through the Casio Triangle',
        'Good exit from Spoon Curve for the main straight',
        'Balance is key for the figure-8 transitions'
      ]
    };

    // Nürburgring - Long Circuit
    const nurburgring: RaceRoute = {
      id: 'nurburgring',
      name: 'Nürburgring GP Circuit',
      location: 'Nürburg',
      country: 'Germany',
      type: 'permanent',
      difficulty: 'medium',
      distance: 5148, // 5.148 km
      laps: 60,
      estimatedLapTime: 82000, // 1:22.000
      maxSpeed: 350,
      minSpeed: 88,
      elevationGain: 68,
      elevationLoss: 68,
      corners: 15,
      straights: 7,
      drsZones: [10, 35], // Döttinger Höhe and start/finish
      pitLaneSpeedLimit: 80,
      
      points: this.generateNurburgringTrack(),
      sectors: [
        {
          id: 1,
          name: 'Sector 1: Castrol',
          startPoint: 0,
          endPoint: 16,
          distance: 1800,
          typicalTime: 28000,
          characteristics: ['medium speed', 'technical', 'elevation']
        },
        {
          id: 2,
          name: 'Sector 2: Mercedes Arena',
          startPoint: 16,
          endPoint: 30,
          distance: 1700,
          typicalTime: 27000,
          characteristics: ['tight complex', 'low speed', 'precision']
        },
        {
          id: 3,
          name: 'Sector 3: Döttinger Höhe',
          startPoint: 30,
          endPoint: 45,
          distance: 1648,
          typicalTime: 27000,
          characteristics: ['high speed', 'long straight', 'fast corners']
        }
      ],
      
      surface: 'asphalt',
      width: 14,
      longestStraight: 1200, // Döttinger Höhe
      fastestCorner: 'Flugplatz',
      slowestCorner: 'Mercedes Arena',
      
      lapRecord: {
        time: 77664, // 1:17.664
        driver: 'Michael Schumacher',
        year: 2004,
        car: 'Ferrari F2004'
      },
      
      mapCenter: { lat: 50.3299, lng: 6.9405 },
      mapZoom: 14,
      
      description: 'A modern circuit with long straights, challenging corners, and significant elevation changes, set in the Eifel mountains.',
      features: [
        'Long Döttinger Höhe straight',
        'Technical Mercedes Arena complex',
        'Significant elevation changes',
        'Historic Nürburgring atmosphere',
        'Variable weather conditions'
      ],
      tips: [
        'Maximum speed on Döttinger Höhe straight',
        'Precision through the Mercedes Arena',
        'Good car balance for the elevation changes',
        'Watch for weather changes in the Eifel mountains'
      ]
    };

    // Add all routes to the map
    this.routes.set(monaco.id, monaco);
    this.routes.set(silverstone.id, silverstone);
    this.routes.set(spa.id, spa);
    this.routes.set(suzuka.id, suzuka);
    this.routes.set(nurburgring.id, nurburgring);
  }

  // Track generation methods (simplified for demo)
  private generateMonacoTrack(): TrackPoint[] {
    const points: TrackPoint[] = [];
    const centerLat = 43.7347;
    const centerLng = 7.4216;
    const radius = 0.015; // ~1.5km radius
    
    // Generate Monaco-style track with tight corners
    for (let i = 0; i <= 50; i++) {
      const angle = (i / 50) * 2 * Math.PI;
      let r = radius;
      
      // Create tight corners (hairpins)
      if (i >= 5 && i <= 8) r = radius * 0.6; // Sainte Devote
      if (i >= 15 && i <= 18) r = radius * 0.5; // Casino Square
      if (i >= 25 && i <= 28) r = radius * 0.4; // Loews Hairpin
      if (i >= 35 && i <= 38) r = radius * 0.6; // Portier
      if (i >= 42 && i <= 45) r = radius * 0.7; // Swimming Pool
      
      const lat = centerLat + r * Math.cos(angle);
      const lng = centerLng + r * Math.sin(angle);
      const elevation = 20 + Math.sin(angle * 3) * 15; // Elevation changes
      
      points.push({
        lat,
        lng,
        elevation,
        sector: Math.floor(i / 17) + 1,
        checkpoint: i % 5 === 0 ? i / 5 : undefined,
        isStartFinish: i === 0,
        cornerName: this.getMonacoCornerName(i),
        cornerDifficulty: this.getMonacoCornerDifficulty(i)
      });
    }
    
    return points;
  }

  private generateSilverstoneTrack(): TrackPoint[] {
    const points: TrackPoint[] = [];
    const centerLat = 52.0786;
    const centerLng = -1.0169;
    const radius = 0.025;
    
    // Generate Silverstone-style flowing track
    for (let i = 0; i <= 60; i++) {
      const angle = (i / 60) * 2 * Math.PI;
      let r = radius;
      
      // Create flowing corners
      if (i >= 8 && i <= 12) r = radius * 0.8; // Copse
      if (i >= 20 && i <= 25) r = radius * 0.9; // Maggotts/Becketts
      if (i >= 35 && i <= 40) r = radius * 0.85; // Abbey
      if (i >= 45 && i <= 50) r = radius * 0.9; // Stowe
      
      const lat = centerLat + r * Math.cos(angle);
      const lng = centerLng + r * Math.sin(angle);
      const elevation = 15 + Math.sin(angle * 2) * 10;
      
      points.push({
        lat,
        lng,
        elevation,
        sector: Math.floor(i / 20) + 1,
        checkpoint: i % 6 === 0 ? i / 6 : undefined,
        isStartFinish: i === 0,
        cornerName: this.getSilverstoneCornerName(i),
        cornerDifficulty: this.getSilverstoneCornerDifficulty(i)
      });
    }
    
    return points;
  }

  private generateSpaTrack(): TrackPoint[] {
    const points: TrackPoint[] = [];
    const centerLat = 50.4372;
    const centerLng = 5.9713;
    const radius = 0.03;
    
    // Generate Spa-style track with elevation changes
    for (let i = 0; i <= 70; i++) {
      const angle = (i / 70) * 2 * Math.PI;
      let r = radius;
      
      // Create Spa characteristics
      if (i >= 5 && i <= 8) r = radius * 0.6; // La Source
      if (i >= 15 && i <= 25) r = radius * 1.1; // Kemmel Straight
      if (i >= 30 && i <= 35) r = radius * 0.7; // Blanchimont
      if (i >= 60 && i <= 65) r = radius * 0.8; // Bus Stop
      
      const lat = centerLat + r * Math.cos(angle);
      const lng = centerLng + r * Math.sin(angle);
      const elevation = 30 + Math.sin(angle * 4) * 25; // Significant elevation changes
      
      points.push({
        lat,
        lng,
        elevation,
        sector: Math.floor(i / 24) + 1,
        checkpoint: i % 7 === 0 ? i / 7 : undefined,
        isStartFinish: i === 0,
        cornerName: this.getSpaCornerName(i),
        cornerDifficulty: this.getSpaCornerDifficulty(i)
      });
    }
    
    return points;
  }

  private generateSuzukaTrack(): TrackPoint[] {
    const points: TrackPoint[] = [];
    const centerLat = 34.8432;
    const centerLng = 136.5361;
    const radius = 0.025;
    
    // Generate Suzuka figure-8 track
    for (let i = 0; i <= 60; i++) {
      const angle = (i / 60) * 2 * Math.PI;
      let r = radius;
      
      // Create figure-8 crossing
      if (i >= 10 && i <= 15) r = radius * 0.8; // Esses
      if (i >= 25 && i <= 30) r = radius * 0.7; // Degner
      if (i >= 40 && i <= 45) r = radius * 0.9; // 130R
      if (i >= 50 && i <= 55) r = radius * 0.6; // Casio Triangle
      
      const lat = centerLat + r * Math.cos(angle);
      const lng = centerLng + r * Math.sin(angle);
      const elevation = 20 + Math.sin(angle * 3) * 12;
      
      points.push({
        lat,
        lng,
        elevation,
        sector: Math.floor(i / 20) + 1,
        checkpoint: i % 6 === 0 ? i / 6 : undefined,
        isStartFinish: i === 0,
        cornerName: this.getSuzukaCornerName(i),
        cornerDifficulty: this.getSuzukaCornerDifficulty(i)
      });
    }
    
    return points;
  }

  private generateNurburgringTrack(): TrackPoint[] {
    const points: TrackPoint[] = [];
    const centerLat = 50.3299;
    const centerLng = 6.9405;
    const radius = 0.022;
    
    // Generate Nürburgring track
    for (let i = 0; i <= 55; i++) {
      const angle = (i / 55) * 2 * Math.PI;
      let r = radius;
      
      // Create Nürburgring characteristics
      if (i >= 8 && i <= 12) r = radius * 0.85; // Castrol S
      if (i >= 20 && i <= 25) r = radius * 0.7; // Mercedes Arena
      if (i >= 30 && i <= 40) r = radius * 1.1; // Döttinger Höhe
      
      const lat = centerLat + r * Math.cos(angle);
      const lng = centerLng + r * Math.sin(angle);
      const elevation = 25 + Math.sin(angle * 3) * 18;
      
      points.push({
        lat,
        lng,
        elevation,
        sector: Math.floor(i / 18) + 1,
        checkpoint: i % 5 === 0 ? i / 5 : undefined,
        isStartFinish: i === 0,
        cornerName: this.getNurburgringCornerName(i),
        cornerDifficulty: this.getNurburgringCornerDifficulty(i)
      });
    }
    
    return points;
  }

  // Corner name helpers
  private getMonacoCornerName(index: number): string {
    const corners = ['Start/Finish', 'Sainte Devote', 'Beau Rivage', 'Massenet', 'Casino Square', 
                     'Mirabeau', 'Loews Hairpin', 'Portier', 'Tunnel', 'Nouvelle Chicane', 
                     'Tabac', 'Piscine', 'Rascasse', 'Anthony Noghes'];
    return corners[Math.floor(index / 4)] || '';
  }

  private getSilverstoneCornerName(index: number): string {
    const corners = ['Start/Finish', 'Abbey', 'Farm', 'Village', 'Aintree', 'Becketts', 
                     'Chapel', 'Stowe', 'Vale', 'Club', 'Copse', 'Maggotts'];
    return corners[Math.floor(index / 5)] || '';
  }

  private getSpaCornerName(index: number): string {
    const corners = ['Start/Finish', 'La Source', 'Eau Rouge', 'Raidillon', 'Kemmel', 
                     'Les Combes', 'Rivage', 'Pouhon', 'Fagnes', 'Stavelot', 'Blanchimont', 
                     'Bus Stop'];
    return corners[Math.floor(index / 6)] || '';
  }

  private getSuzukaCornerName(index: number): string {
    const corners = ['Start/Finish', 'First Curve', 'Esses', 'Dunlop', 'Degner 1', 'Degner 2', 
                     'Hairpin', 'Spoon Curve', '130R', 'Casio Triangle'];
    return corners[Math.floor(index / 6)] || '';
  }

  private getNurburgringCornerName(index: number): string {
    const corners = ['Start/Finish', 'Castrol S', 'Ford', 'Dunlop', 'Michael Schumacher S', 
                     'Bilstein', 'Veedol S', 'Mercedes Arena', 'Bit Kurve', 'Döttinger Höhe'];
    return corners[Math.floor(index / 5)] || '';
  }

  // Corner difficulty helpers
  private getMonacoCornerDifficulty(index: number): 'easy' | 'medium' | 'hard' | 'expert' {
    if (index >= 25 && index <= 28) return 'expert'; // Loews Hairpin
    if (index >= 15 && index <= 18) return 'hard'; // Casino Square
    if (index >= 35 && index <= 38) return 'hard'; // Portier
    if (index >= 42 && index <= 45) return 'hard'; // Swimming Pool
    return 'medium';
  }

  private getSilverstoneCornerDifficulty(index: number): 'easy' | 'medium' | 'hard' | 'expert' {
    if (index >= 20 && index <= 25) return 'hard'; // Maggotts/Becketts
    if (index >= 8 && index <= 12) return 'hard'; // Copse
    return 'medium';
  }

  private getSpaCornerDifficulty(index: number): 'easy' | 'medium' | 'hard' | 'expert' {
    if (index >= 15 && index <= 25) return 'easy'; // Kemmel Straight
    if (index >= 30 && index <= 35) return 'hard'; // Blanchimont
    if (index >= 5 && index <= 8) return 'hard'; // La Source/Eau Rouge
    return 'medium';
  }

  private getSuzukaCornerDifficulty(index: number): 'easy' | 'medium' | 'hard' | 'expert' {
    if (index >= 40 && index <= 45) return 'expert'; // 130R
    if (index >= 50 && index <= 55) return 'hard'; // Casio Triangle
    if (index >= 10 && index <= 15) return 'hard'; // Esses
    return 'medium';
  }

  private getNurburgringCornerDifficulty(index: number): 'easy' | 'medium' | 'hard' | 'expert' {
    if (index >= 30 && index <= 40) return 'easy'; // Döttinger Höhe
    if (index >= 20 && index <= 25) return 'hard'; // Mercedes Arena
    return 'medium';
  }

  // Public API methods
  public getAllRoutes(): RaceRoute[] {
    return Array.from(this.routes.values());
  }

  public getRoute(id: string): RaceRoute | undefined {
    return this.routes.get(id);
  }

  public selectRoute(id: string): boolean {
    const route = this.routes.get(id);
    if (route) {
      this.selectedRoute = route;
      return true;
    }
    return false;
  }

  public getSelectedRoute(): RaceRoute | null {
    return this.selectedRoute;
  }

  public getRoutesByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): RaceRoute[] {
    return this.getAllRoutes().filter(route => route.difficulty === difficulty);
  }

  public getRoutesByType(type: 'street' | 'permanent' | 'hybrid'): RaceRoute[] {
    return this.getAllRoutes().filter(route => route.type === type);
  }

  public searchRoutes(query: string): RaceRoute[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllRoutes().filter(route => 
      route.name.toLowerCase().includes(lowercaseQuery) ||
      route.location.toLowerCase().includes(lowercaseQuery) ||
      route.country.toLowerCase().includes(lowercaseQuery) ||
      route.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  public validateRoute(routeId: string): { valid: boolean; issues: string[] } {
    const route = this.getRoute(routeId);
    if (!route) {
      return { valid: false, issues: ['Route not found'] };
    }

    const issues: string[] = [];

    // Validate track points
    if (route.points.length < 10) {
      issues.push('Track has too few points');
    }

    if (route.points.length === 0 || !route.points[0].isStartFinish) {
      issues.push('Missing start/finish point');
    }

    // Validate sectors
    if (route.sectors.length === 0) {
      issues.push('No sectors defined');
    }

    // Validate basic data
    if (route.distance <= 0) {
      issues.push('Invalid track distance');
    }

    if (route.corners <= 0) {
      issues.push('Invalid corner count');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  public calculateRouteStatistics(routeId: string): {
    totalDistance: number;
    estimatedRaceTime: number;
    averageSpeed: number;
    technicalRating: number;
  } | null {
    const route = this.getRoute(routeId);
    if (!route) return null;

    const totalDistance = route.distance * route.laps;
    const estimatedRaceTime = route.estimatedLapTime * route.laps;
    const averageSpeed = (totalDistance / estimatedRaceTime) * 3600; // km/h
    
    // Calculate technical rating based on corners, elevation, and difficulty
    const technicalRating = (route.corners * 2) + (route.elevationGain / 10) + 
      (route.difficulty === 'expert' ? 10 : route.difficulty === 'hard' ? 7 : 
       route.difficulty === 'medium' ? 4 : 2);

    return {
      totalDistance,
      estimatedRaceTime,
      averageSpeed,
      technicalRating
    };
  }
}

// Singleton instance
let raceRoutesServiceInstance: RaceRoutesService | null = null;

export function getRaceRoutesService(): RaceRoutesService {
  if (!raceRoutesServiceInstance) {
    raceRoutesServiceInstance = new RaceRoutesService();
  }
  return raceRoutesServiceInstance;
}

export { RaceRoutesService };

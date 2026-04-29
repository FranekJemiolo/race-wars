/**
 * Leaderboard Service
 * 
 * Manages real-time leaderboard data and WebSocket communication
 * Integrates with GPS tracking and anti-cheat systems
 */

import { ClientMessage, ServerMessage } from '@race-wars/shared';

export interface LeaderboardEntry {
  position: number;
  participantId: string;
  name: string;
  time: number;
  gap: number;
  speed: number;
  distance: number;
  status: 'active' | 'finished' | 'disqualified' | 'dnf';
  lastUpdate: number;
  antiCheatRisk?: number;
  laps: number;
  currentLapTime: number;
  bestLapTime: number;
  avgSpeed: number;
  maxSpeed: number;
  progress: number; // 0-1 percentage of race completion
}

export interface RaceInfo {
  id: string;
  name: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished' | 'cancelled';
  startTime?: number;
  endTime?: number;
  totalTime?: number;
  totalDistance: number;
  totalLaps: number;
  participants: number;
  finished: number;
  dnf: number;
  disqualified: number;
}

export interface LeaderboardConfig {
  updateInterval: number; // milliseconds
  maxHistorySize: number;
  enableAnimations: boolean;
  showAntiCheatWarnings: boolean;
  autoRefresh: boolean;
}

export type LeaderboardEvent = 
  | { type: 'entry_updated'; entry: LeaderboardEntry }
  | { type: 'position_changed'; participantId: string; oldPosition: number; newPosition: number }
  | { type: 'race_status_changed'; status: string }
  | { type: 'anti_cheat_warning'; participantId: string; riskScore: number }
  | { type: 'participant_finished'; participantId: string; position: number; time: number }
  | { type: 'connection_status'; status: 'connected' | 'disconnected' | 'error' };

export class LeaderboardService {
  private ws: WebSocket | null = null;
  private config: LeaderboardConfig;
  private eventListeners: Map<string, ((event: LeaderboardEvent) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimeout?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  private lastHeartbeat = 0;
  
  // Data storage
  private leaderboard: Map<string, LeaderboardEntry> = new Map();
  private raceInfo: RaceInfo | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private lastUpdateTime = 0;

  constructor(config: Partial<LeaderboardConfig> = {}) {
    this.config = {
      updateInterval: 1000,
      maxHistorySize: 100,
      enableAnimations: true,
      showAntiCheatWarnings: true,
      autoRefresh: true,
      ...config
    };
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(raceId: string, serverUrl: string = 'ws://localhost:8080'): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionStatus = 'connecting';
    this.emit('connection_status', { status: this.connectionStatus });

    try {
      this.ws = new WebSocket(`${serverUrl}?raceId=${raceId}`);
      this.setupWebSocketHandlers();
      
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        
        this.ws!.onopen = () => {
          clearTimeout(timeout);
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.emit('connection_status', { status: this.connectionStatus });
          this.startHeartbeat();
          resolve();
        };
        
        this.ws!.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Connection failed'));
        };
      });

      // Request initial state
      this.sendMessage({
        type: 'FULL_RESYNC',
        version: '1.0'
      });

    } catch (error) {
      this.connectionStatus = 'error';
      this.emit('connection_status', { status: this.connectionStatus });
      throw error;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.clearReconnectTimeout();
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connectionStatus = 'disconnected';
    this.emit('connection_status', { status: this.connectionStatus });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.connectionStatus = 'disconnected';
      this.emit('connection_status', { status: this.connectionStatus });
      this.stopHeartbeat();
      
      if (this.config.autoRefresh && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatus = 'error';
      this.emit('connection_status', { status: this.connectionStatus });
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: ServerMessage): void {
    this.lastUpdateTime = Date.now();
    this.lastHeartbeat = this.lastUpdateTime;

    switch (message.type) {
      case 'STATE_SNAPSHOT':
        this.handleStateSnapshot(message);
        break;

      case 'LEADERBOARD_UPDATE':
        this.handleLeaderboardUpdate(message);
        break;

      case 'POSITION_UPDATE':
        this.handlePositionUpdate(message);
        break;

      case 'RACE_STATUS_UPDATE':
        this.handleRaceStatusUpdate(message);
        break;

      case 'ANTI_CHEAT_WARNING':
        this.handleAntiCheatWarning(message);
        break;

      case 'PARTICIPANT_FINISHED':
        this.handleParticipantFinished(message);
        break;

      case 'PARTICIPANT_DISQUALIFIED':
        this.handleParticipantDisqualified(message);
        break;

      case 'PONG':
        // Heartbeat response
        break;

      default:
        console.warn('Unknown message type:', (message as any).type);
    }
  }

  /**
   * Handle state snapshot message
   */
  private handleStateSnapshot(message: any): void {
    if (!message.state) return;

    // Update race info
    this.raceInfo = {
      id: message.state.race.id,
      name: message.state.race.name,
      status: message.state.race.status || 'waiting',
      startTime: message.state.race.startTime,
      endTime: message.state.race.endTime,
      totalTime: message.state.race.totalTime,
      totalDistance: message.state.race.totalLength || 0,
      totalLaps: message.state.race.totalLaps || 0,
      participants: message.state.players.length,
      finished: message.state.players.filter((p: any) => p.status === 'finished').length,
      dnf: message.state.players.filter((p: any) => p.status === 'dnf').length,
      disqualified: message.state.players.filter((p: any) => p.status === 'disqualified').length
    };

    // Update leaderboard entries
    const newEntries = new Map<string, LeaderboardEntry>();
    const sortedPlayers = [...message.state.players].sort((a: any, b: any) => {
      if (a.status === 'finished' && b.status !== 'finished') return -1;
      if (a.status !== 'finished' && b.status === 'finished') return 1;
      return (a.totalDistance || 0) - (b.totalDistance || 0);
    });

    sortedPlayers.forEach((player: any, index: number) => {
      const oldEntry = this.leaderboard.get(player.id);
      const entry: LeaderboardEntry = {
        position: index + 1,
        participantId: player.id,
        name: player.name,
        time: player.totalTime || 0,
        gap: this.calculateGap(index, sortedPlayers),
        speed: player.currentSpeed || 0,
        distance: player.totalDistance || 0,
        status: player.status || 'active',
        lastUpdate: Date.now(),
        antiCheatRisk: player.antiCheatRisk || 0,
        laps: player.completedLaps || 0,
        currentLapTime: player.currentLapTime || 0,
        bestLapTime: player.bestLapTime || 0,
        avgSpeed: player.avgSpeed || 0,
        maxSpeed: player.maxSpeed || 0,
        progress: this.calculateProgress(player, message.state.race)
      };

      newEntries.set(player.id, entry);

      // Emit position change event
      if (oldEntry && oldEntry.position !== entry.position) {
        this.emit('position_changed', {
          participantId: player.id,
          oldPosition: oldEntry.position,
          newPosition: entry.position
        });
      }

      // Emit entry update event
      this.emit('entry_updated', { entry });
    });

    this.leaderboard = newEntries;
  }

  /**
   * Handle leaderboard update message
   */
  private handleLeaderboardUpdate(message: any): void {
    if (!message.leaderboard) return;

    message.leaderboard.forEach((entryData: any) => {
      const entry: LeaderboardEntry = {
        ...entryData,
        lastUpdate: Date.now()
      };

      const oldEntry = this.leaderboard.get(entry.participantId);
      this.leaderboard.set(entry.participantId, entry);

      if (oldEntry && oldEntry.position !== entry.position) {
        this.emit('position_changed', {
          participantId: entry.participantId,
          oldPosition: oldEntry.position,
          newPosition: entry.position
        });
      }

      this.emit('entry_updated', { entry });
    });
  }

  /**
   * Handle position update message
   */
  private handlePositionUpdate(message: any): void {
    const entry = this.leaderboard.get(message.participantId);
    if (!entry) return;

    const updatedEntry: LeaderboardEntry = {
      ...entry,
      speed: message.speed || entry.speed,
      distance: message.distance || entry.distance,
      lastUpdate: Date.now(),
      progress: this.raceInfo ? (message.distance / this.raceInfo.totalDistance) : entry.progress
    };

    this.leaderboard.set(message.participantId, updatedEntry);
    this.emit('entry_updated', { entry: updatedEntry });
  }

  /**
   * Handle race status update
   */
  private handleRaceStatusUpdate(message: any): void {
    if (this.raceInfo) {
      this.raceInfo.status = message.raceStatus;
      this.emit('race_status_changed', { status: message.raceStatus });
    }
  }

  /**
   * Handle anti-cheat warning
   */
  private handleAntiCheatWarning(message: any): void {
    const entry = this.leaderboard.get(message.participantId);
    if (!entry) return;

    entry.antiCheatRisk = message.riskScore;
    this.leaderboard.set(message.participantId, entry);
    
    this.emit('anti_cheat_warning', {
      participantId: message.participantId,
      riskScore: message.riskScore
    });

    if (this.config.showAntiCheatWarnings) {
      this.emit('entry_updated', { entry });
    }
  }

  /**
   * Handle participant finished
   */
  private handleParticipantFinished(message: any): void {
    const entry = this.leaderboard.get(message.participantId);
    if (!entry) return;

    entry.status = 'finished';
    entry.time = message.time;
    entry.position = message.position;
    
    this.leaderboard.set(message.participantId, entry);
    
    this.emit('participant_finished', {
      participantId: message.participantId,
      position: message.position,
      time: message.time
    });

    this.emit('entry_updated', { entry });
  }

  /**
   * Handle participant disqualified
   */
  private handleParticipantDisqualified(message: any): void {
    const entry = this.leaderboard.get(message.participantId);
    if (!entry) return;

    entry.status = 'disqualified';
    entry.antiCheatRisk = 100;
    
    this.leaderboard.set(message.participantId, entry);
    this.emit('entry_updated', { entry });
  }

  /**
   * Calculate time gap to leader
   */
  private calculateGap(index: number, sortedPlayers: any[]): number {
    if (index === 0) return 0;
    const leaderTime = sortedPlayers[0]?.totalTime || 0;
    const currentTime = sortedPlayers[index]?.totalTime || 0;
    return currentTime - leaderTime;
  }

  /**
   * Calculate race progress percentage
   */
  private calculateProgress(player: any, race: any): number {
    const totalDistance = race.totalLength || 0;
    if (totalDistance === 0) return 0;
    return Math.min((player.totalDistance || 0) / totalDistance, 1);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimeout();
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('connection_status', { status: 'connecting' });
      
      // Implementation would need raceId and serverUrl
      // this.connect(this.currentRaceId, this.serverUrl).catch(() => {
      //   if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      //     this.connectionStatus = 'error';
      //     this.emit('connection_status', { status: this.connectionStatus });
      //   }
      // });
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
  }

  /**
   * Clear reconnection timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'PING',
          timestamp: Date.now()
        });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Add event listener
   */
  on(eventType: string, listener: (event: LeaderboardEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, listener: (event: LeaderboardEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, event: LeaderboardEvent): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Get current leaderboard data
   */
  getLeaderboard(): LeaderboardEntry[] {
    return Array.from(this.leaderboard.values()).sort((a, b) => a.position - b.position);
  }

  /**
   * Get race information
   */
  getRaceInfo(): RaceInfo | null {
    return this.raceInfo;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    return this.connectionStatus;
  }

  /**
   * Get specific participant entry
   */
  getEntry(participantId: string): LeaderboardEntry | undefined {
    return this.leaderboard.get(participantId);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LeaderboardConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LeaderboardConfig {
    return { ...this.config };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.leaderboard.clear();
    this.raceInfo = null;
    this.lastUpdateTime = 0;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalParticipants: number;
    activeParticipants: number;
    finishedParticipants: number;
    averageSpeed: number;
    bestLapTime: number;
    lastUpdateTime: number;
  } {
    const entries = Array.from(this.leaderboard.values());
    const activeEntries = entries.filter(e => e.status === 'active');
    const finishedEntries = entries.filter(e => e.status === 'finished');
    
    const averageSpeed = entries.length > 0 ? 
      entries.reduce((sum, e) => sum + e.avgSpeed, 0) / entries.length : 0;
    
    const bestLapTimes = entries
      .map(e => e.bestLapTime)
      .filter(time => time > 0)
      .sort((a, b) => a - b);
    
    return {
      totalParticipants: entries.length,
      activeParticipants: activeEntries.length,
      finishedParticipants: finishedEntries.length,
      averageSpeed,
      bestLapTime: bestLapTimes[0] || 0,
      lastUpdateTime: this.lastUpdateTime
    };
  }
}

// Singleton instance
let leaderboardService: LeaderboardService | null = null;

export function getLeaderboardService(config?: Partial<LeaderboardConfig>): LeaderboardService {
  if (!leaderboardService) {
    leaderboardService = new LeaderboardService(config);
  }
  return leaderboardService;
}

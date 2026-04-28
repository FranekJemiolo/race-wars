import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PositionData} from './gpsTracking.service';

const OFFLINE_QUEUE_KEY = '@race_wars_offline_queue';
const OFFLINE_SESSIONS_KEY = '@race_wars_offline_sessions';

export interface QueuedPosition {
  position: PositionData;
  sessionId: string;
  timestamp: number;
}

export interface OfflineSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  positions: PositionData[];
}

export class OfflineModeService {
  private isOnline: boolean = true;
  private positionQueue: QueuedPosition[] = [];
  private offlineSessions: OfflineSession[] = [];
  private currentSession: OfflineSession | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadQueue();
    await this.loadOfflineSessions();
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.syncQueuedData();
      }
    });
  }

  async queuePosition(position: PositionData, sessionId: string): Promise<void> {
    const queuedPosition: QueuedPosition = {
      position,
      sessionId,
      timestamp: Date.now(),
    };

    this.positionQueue.push(queuedPosition);
    await this.saveQueue();

    if (this.currentSession && this.currentSession.sessionId === sessionId) {
      this.currentSession.positions.push(position);
      await this.saveOfflineSessions();
    }
  }

  async startOfflineSession(sessionId: string): Promise<void> {
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      positions: [],
    };
    this.offlineSessions.push(this.currentSession);
    await this.saveOfflineSessions();
  }

  async endOfflineSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession = null;
      await this.saveOfflineSessions();
    }
  }

  private async syncQueuedData(): Promise<void> {
    if (this.positionQueue.length === 0) return;

    console.log(`Syncing ${this.positionQueue.length} queued positions`);

    // TODO: Implement actual API call to sync positions
    // For now, just clear the queue
    this.positionQueue = [];
    await this.saveQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueJson) {
        this.positionQueue = JSON.parse(queueJson);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OFFLINE_QUEUE_KEY,
        JSON.stringify(this.positionQueue),
      );
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  private async loadOfflineSessions(): Promise<void> {
    try {
      const sessionsJson = await AsyncStorage.getItem(OFFLINE_SESSIONS_KEY);
      if (sessionsJson) {
        this.offlineSessions = JSON.parse(sessionsJson);
      }
    } catch (error) {
      console.error('Error loading offline sessions:', error);
    }
  }

  private async saveOfflineSessions(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OFFLINE_SESSIONS_KEY,
        JSON.stringify(this.offlineSessions),
      );
    } catch (error) {
      console.error('Error saving offline sessions:', error);
    }
  }

  getQueueSize(): number {
    return this.positionQueue.length;
  }

  getOfflineSessions(): OfflineSession[] {
    return [...this.offlineSessions];
  }

  getCurrentSession(): OfflineSession | null {
    return this.currentSession;
  }

  async clearQueue(): Promise<void> {
    this.positionQueue = [];
    await this.saveQueue();
  }

  async clearOfflineSessions(): Promise<void> {
    this.offlineSessions = [];
    this.currentSession = null;
    await this.saveOfflineSessions();
  }

  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  static formatQueueSize(count: number): string {
    if (count === 0) return 'No pending uploads';
    if (count === 1) return '1 pending upload';
    return `${count} pending uploads`;
  }

  static getSessionDuration(session: OfflineSession): string {
    const end = session.endTime || Date.now();
    const duration = end - session.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

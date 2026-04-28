export interface User {
  id: string;
  email: string;
  displayName: string;
  carNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CarProfile {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  specifications?: Record<string, any>;
  isDefault: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  trackId: string;
  name: string;
  sessionType: 'race' | 'practice' | 'qualifying' | 'hot_lap';
  scheduledStart: string;
  scheduledEnd: string;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface PositionData {
  sessionId: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

export interface Incident {
  id: string;
  sessionId: string;
  participantId: string;
  type: 'off_track' | 'collision' | 'spin' | 'stall';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  reportedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface GPSConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  updateInterval: number;
}

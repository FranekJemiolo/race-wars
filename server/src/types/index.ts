/**
 * Type definitions for Race Wars application
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'admin' | 'user' | 'marshal';
  isVerified: boolean;
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  racesParticipated: number;
  racesWon: number;
  totalTimeRaced: number;
}

export interface Session {
  id: string;
  trackId: string;
  name: string;
  description: string;
  sessionType: 'practice' | 'qualifying' | 'race' | 'track_day';
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  maxParticipants: number;
  participants: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cancellationReason?: string;
}

export interface SessionStatus {
  sessionId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  activeParticipants: number;
  currentPositions?: Position[];
  startTime?: Date;
  endTime?: Date;
}

export interface Position {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number;
  heading: number;
  sessionId?: string;
  userId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'race_started' | 'race_finished' | 'flag_change' | 'safety_car' | 'penalty' | 'checkpoint' | 'position_update';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  enableEmail: boolean;
  enablePush: boolean;
  enableInApp: boolean;
  raceNotifications: boolean;
  flagNotifications: boolean;
  penaltyNotifications: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateNotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: string;
  expiresAt?: Date;
}

export interface RaceEvent {
  type: 'violation' | 'checkpoint' | 'flag_change' | 'safety_car' | 'penalty';
  userId: string;
  timestamp: number;
  data: any;
}

export interface RaceParticipant {
  id: string;
  raceId: string;
  userId: string;
  username: string;
  displayName: string;
  status: 'joined' | 'racing' | 'finished' | 'disconnected' | 'disqualified';
  joinedAt: Date;
  leftAt?: Date;
  finishedAt?: Date;
  position?: number;
  totalTime?: number;
  bestLapTime?: number;
  checkpointsPassed: number;
  currentCheckpoint: number;
  lapCount: number;
  isDNF: boolean;
  disqualificationReason?: string;
  vehicle?: string;
  notes?: string;
}

export interface RaceResult {
  id: string;
  raceId: string;
  participantId: string;
  position: number;
  totalTime: number;
  bestLapTime?: number;
  averageLapTime?: number;
  gapToLeader?: number;
  status: 'finished' | 'dnf' | 'dsq' | 'dns';
  points?: number;
  prizeMoney?: number;
}

export interface EnforcementZone {
  id: string;
  trackId: string;
  name: string;
  zoneType: 'speed_trap' | 'pit_lane' | 'speed_limit_zone' | 'no_passing_zone';
  startDistance: number;
  endDistance: number;
  speedLimitKmh?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpeedViolation {
  id: string;
  userId: string;
  sessionId: string;
  zoneId: string;
  speed: number;
  speedLimit: number;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
  };
  penalty?: {
    type: string;
    value: number;
    reason: string;
  };
}

export interface Sector {
  id: string;
  trackId: string;
  name: string;
  sectorOrder: number;
  startDistance: number;
  endDistance: number;
  marshalZoneId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarshalZone {
  id: string;
  sectorId: string;
  name: string;
  positionLat: number;
  positionLng: number;
  radioChannel: string;
  primaryContact: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Checkpoint {
  id: string;
  trackId: string;
  name: string;
  checkpointOrder: number;
  positionLat: number;
  positionLng: number;
  radiusMeters: number;
  isMandatory: boolean;
  timeLimitSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  locationName: string;
  locationCountry: string;
  locationLat: number;
  locationLng: number;
  trackType: 'road_circuit' | 'street_circuit' | 'off_road' | 'mixed';
  difficulty: 'easy' | 'intermediate' | 'hard' | 'expert';
  distanceMeters: number;
  elevationGain: number;
  bestLapTime?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomRoute {
  id: string;
  userId: string;
  name: string;
  description: string;
  routeType: 'training' | 'leisure' | 'challenge' | 'commute';
  isPublic: boolean;
  totalDistanceMeters: number;
  estimatedTimeMinutes: number;
  difficultyLevel: 'easy' | 'intermediate' | 'hard';
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomRoutePoint {
  id: string;
  routeId: string;
  pointOrder: number;
  positionLat: number;
  positionLng: number;
  radiusMeters: number;
  instruction?: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  eventType: 'race' | 'track_day' | 'training' | 'social';
  locationName: string;
  locationCountry: string;
  locationLat: number;
  locationLng: number;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  registrationFee?: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Penalty {
  id: string;
  userId: string;
  sessionId: string;
  type: 'speeding' | 'jump_start' | 'blocking' | 'ignore_flags' | 'unsportsmanlike';
  severity: 'warning' | 'time_penalty' | 'drive_through' | 'disqualification';
  points: number;
  reason: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
  issuedBy: string;
  status: 'active' | 'appealed' | 'overturned' | 'served';
  appealReason?: string;
  appealDate?: Date;
}

export interface Incident {
  id: string;
  sessionId: string;
  type: 'collision' | 'off_track' | 'mechanical' | 'medical' | 'debris' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  reportedBy: string;
  status: 'reported' | 'investigating' | 'resolved';
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  dataPoints: number;
  fileSize: number;
  format: string;
  storageUrl?: string;
  isProcessed: boolean;
  createdAt: Date;
}

export interface CarProfile {
  id: string;
  userId: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  class: 'gt3' | 'gt4' | 'touring' | 'prototype' | 'street';
  specifications: {
    horsepower: number;
    torque: number;
    weight: number;
    topSpeed: number;
    acceleration: number;
  };
  modifications: string[];
  imageUrl?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserExperience {
  id: string;
  userId: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  totalRaces: number;
  totalHours: number;
  favoriteTrack?: string;
  preferredCarClass?: string;
  achievements: Achievement[];
  statistics: {
    averageLapTime: number;
    bestLapTime: number;
    consistency: number;
    raceFinishRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface OAuthProvider {
  id: string;
  userId: string;
  provider: 'google' | 'apple' | 'facebook';
  providerId: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

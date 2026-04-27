export type LatLng = {
  lat: number
  lon: number
}

export type PlayerState =
  | "NOT_JOINED"
  | "READY"
  | "ARMED"
  | "RACING"
  | "OFF_ROUTE"
  | "FINISHED"
  | "DISCONNECTED"
  | "DISQUALIFIED"
  | "STALLED"

export interface Player {
  id: string
  name: string
  state: PlayerState
  position: LatLng
  projectedPosition: LatLng
  progress: number
  progressSegment: number
  speed: number
  lastUpdate: number
}

export interface Checkpoint {
  id: string
  index: number
  position: LatLng
  radius: number
  direction?: LatLng // Expected direction vector
}

export interface RaceRoute {
  points: LatLng[]
  checkpoints: Checkpoint[]
  isLoop: boolean
  startLine: { start: LatLng; end: LatLng }
  finishLine: { start: LatLng; end: LatLng }
  totalLength: number
  version: string
}

export type RaceState =
  | "CREATED"
  | "COUNTDOWN"
  | "LIVE"
  | "PAUSED"
  | "FINISHED"
  | "ABORTED"

export interface Race {
  id: string
  name: string
  state: RaceState
  route: RaceRoute
  players: Record<string, Player>
  startTime?: number
  endTime?: number
  configVersion: string
}

export interface PlayerRaceProgress {
  nextCheckpointIndex: number
  lastCheckpointPassedAt: number
  lap: number
}

export interface ProjectionResult {
  point: LatLng
  segmentIndex: number
  progress: number
  distanceToRoute: number
  confidence: number
}

export interface PositionUpdateInput {
  player: Player
  lat: number
  lon: number
  timestamp: number
  route: LatLng[]
}

export interface PlayerUpdateResult {
  player: Player
  projection: ProjectionResult
  events: string[]
}

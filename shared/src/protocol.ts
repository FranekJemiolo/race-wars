import { Player, RaceState, LatLng } from "./types"

export const PROTOCOL_VERSION = "1.0"

export type ClientMessage =
  | { type: "JOIN_RACE"; playerId: string; name: string; version: string }
  | { type: "POSITION_UPDATE"; lat: number; lon: number; timestamp: number; speed?: number; heading?: number; accuracy?: number }
  | { type: "READY" }
  | { type: "PING"; timestamp: number }
  | { type: "REJOIN"; playerId: string }
  | { type: "FULL_RESYNC" }

export type ServerMessage =
  | { type: "STATE_SNAPSHOT"; state: any; seq: number; timestamp: number; version: string }
  | { type: "POSITION_BATCH"; players: Player[]; seq: number; timestamp: number }
  | { type: "LEADERBOARD"; leaderboard: LeaderboardEntry[]; seq: number; timestamp: number }
  | { type: "RACE_EVENT"; event: RaceEvent; seq: number }
  | { type: "PONG"; timestamp: number }
  | { type: "CRITICAL_ERROR"; code: string; message: string }
  | { type: "ROUTE_DATA"; route: any; routeHash: string }

export interface LeaderboardEntry {
  playerId: string
  name: string
  rank: number
  progress: number
  lap: number
  finished: boolean
  finishTime?: number
}

export type RaceEventType =
  | "RACE_STARTED"
  | "RACE_FINISHED"
  | "RACE_PAUSED"
  | "RACE_RESUMED"
  | "RACE_ABORTED"
  | "CHECKPOINT_PASSED"
  | "LAP_COMPLETED"
  | "OFF_ROUTE"
  | "BACK_ON_ROUTE"
  | "PLAYER_FINISHED"
  | "PLAYER_DISQUALIFIED"
  | "LOW_CONFIDENCE"
  | "INVALID_GPS"
  | "STALE_UPDATE"

export interface RaceEvent {
  type: RaceEventType
  playerId?: string
  timestamp: number
  data?: any
}

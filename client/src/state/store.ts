import { Player, LeaderboardEntry, RaceState, LatLng } from "@race-wars/shared"

export interface AppState {
  players: Map<string, Player>
  leaderboard: LeaderboardEntry[]
  raceState: RaceState
  selfPlayerId: string | null
  selfPosition: LatLng | null
  connectionState: "connecting" | "connected" | "disconnected"
  events: string[]
}

const initialState: AppState = {
  players: new Map(),
  leaderboard: [],
  raceState: "CREATED",
  selfPlayerId: null,
  selfPosition: null,
  connectionState: "disconnected",
  events: []
}

class Store {
  private state: AppState
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.state = { ...initialState, players: new Map() }
  }

  getState(): AppState {
    return this.state
  }

  setState(partial: Partial<AppState>): void {
    this.state = { ...this.state, ...partial }
    this.notify()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach(listener => listener())
  }

  updatePlayer(player: Player): void {
    this.state.players.set(player.id, player)
    this.notify()
  }

  updatePlayers(players: Player[]): void {
    players.forEach(player => this.state.players.set(player.id, player))
    this.notify()
  }

  updateLeaderboard(leaderboard: LeaderboardEntry[]): void {
    this.state.leaderboard = leaderboard
    this.notify()
  }

  addEvent(event: string): void {
    this.state.events.push(event)
    if (this.state.events.length > 100) {
      this.state.events.shift()
    }
    this.notify()
  }

  reset(): void {
    this.state = { ...initialState, players: new Map() }
    this.notify()
  }
}

export const store = new Store()

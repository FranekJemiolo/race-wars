import { Race, RaceState, RaceRoute, Player } from "@race-wars/shared"
import { log } from "../utils/logger"

export interface RaceManager {
  race: Race
  transitionState(newState: RaceState): void
  addPlayer(player: Player): void
  removePlayer(playerId: string): void
  getPlayer(playerId: string): Player | undefined
  getAllPlayers(): Player[]
  setRoute(route: RaceRoute): void
}

/**
 * Creates a new race manager.
 */
export function createRaceManager(raceId: string, name: string, route: RaceRoute): RaceManager {
  const race: Race = {
    id: raceId,
    name,
    state: "CREATED",
    route,
    players: {},
    configVersion: "1.0"
  }

  return {
    race,
    transitionState(newState: RaceState) {
      const oldState = race.state
      race.state = newState
      
      log(`Race ${raceId} state transition: ${oldState} -> ${newState}`)
      
      if (newState === "LIVE" && !race.startTime) {
        race.startTime = Date.now()
      }
      
      if (newState === "FINISHED" && !race.endTime) {
        race.endTime = Date.now()
      }
    },
    
    addPlayer(player: Player) {
      race.players[player.id] = player
      log(`Player ${player.id} joined race ${raceId}`)
    },
    
    removePlayer(playerId: string) {
      delete race.players[playerId]
      log(`Player ${playerId} left race ${raceId}`)
    },
    
    getPlayer(playerId: string) {
      return race.players[playerId]
    },
    
    getAllPlayers() {
      return Object.values(race.players)
    },
    
    setRoute(route: RaceRoute) {
      race.route = route
      log(`Route updated for race ${raceId}`)
    }
  }
}

/**
 * Validates if race can transition to target state.
 */
export function canTransition(currentState: RaceState, targetState: RaceState): boolean {
  const validTransitions: Record<RaceState, RaceState[]> = {
    CREATED: ["COUNTDOWN", "ABORTED"],
    COUNTDOWN: ["LIVE", "CREATED", "ABORTED"],
    LIVE: ["PAUSED", "FINISHED", "ABORTED"],
    PAUSED: ["LIVE", "ABORTED"],
    FINISHED: [],
    ABORTED: []
  }
  
  return validTransitions[currentState].includes(targetState)
}

/**
 * Checks minimum race start conditions.
 */
export function checkStartConditions(race: Race): { canStart: boolean; reason?: string } {
  const playerCount = Object.keys(race.players).length
  
  if (playerCount < 1) {
    return { canStart: false, reason: "No players joined" }
  }
  
  const readyPlayers = Object.values(race.players).filter(p => p.state === "READY")
  if (readyPlayers.length < 1) {
    return { canStart: false, reason: "No players ready" }
  }
  
  return { canStart: true }
}

/**
 * Computes race duration in milliseconds.
 */
export function computeRaceDuration(race: Race): number {
  if (!race.startTime) return 0
  const endTime = race.endTime || Date.now()
  return endTime - race.startTime
}

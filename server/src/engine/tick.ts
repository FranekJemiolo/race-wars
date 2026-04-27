import { CONFIG } from "@race-wars/shared"

export function startTick(): void {
  setInterval(() => {
    // TODO: Process inputs, update players, compute leaderboard, broadcast
    console.log("tick")
  }, CONFIG.TICK_RATE)
}

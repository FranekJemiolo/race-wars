import { ServerMessage } from "@race-wars/shared"
import { store } from "../state/store"
import { onMessage } from "./socket"

export function setupMessageHandlers(): void {
  // Handle state snapshot
  onMessage("STATE_SNAPSHOT", (msg) => {
    const { state } = msg
    if (state.players) {
      store.updatePlayers(state.players)
    }
    if (state.race) {
      store.setState({ raceState: state.race.state })
    }
  })

  // Handle position batch
  onMessage("POSITION_BATCH", (msg) => {
    store.updatePlayers(msg.players)
  })

  // Handle leaderboard
  onMessage("LEADERBOARD", (msg) => {
    store.updateLeaderboard(msg.leaderboard)
  })

  // Handle race events
  onMessage("RACE_EVENT", (msg) => {
    const { event } = msg
    store.addEvent(`${event.type}:${event.playerId || "system"}`)
  })

  // Handle critical errors
  onMessage("CRITICAL_ERROR", (msg) => {
    console.error("Critical error from server:", msg.code, msg.message)
    store.addEvent(`ERROR:${msg.code}`)
  })

  // Handle pong
  onMessage("PONG", (msg) => {
    // Calculate latency
    const latency = Date.now() - msg.timestamp
    console.log("Latency:", latency, "ms")
  })
}

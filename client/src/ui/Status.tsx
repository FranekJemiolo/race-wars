import { useEffect, useState } from "react"
import { RaceState } from "@race-wars/shared"
import { store } from "../state/store"

export default function Status() {
  const [raceState, setRaceState] = useState<RaceState>("CREATED")
  const [events, setEvents] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState()
      setRaceState(state.raceState)
      setEvents(state.events.slice(-5)) // Show last 5 events
    })

    return unsubscribe
  }, [])

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      left: "20px",
      right: "20px",
      background: "rgba(26, 26, 46, 0.9)",
      padding: "15px 20px",
      borderRadius: "12px",
      color: "#fff",
      fontFamily: "sans-serif",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 100
    }}>
      <div>
        <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px" }}>RACE STATUS</div>
        <div style={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          color: getRaceStateColor(raceState)
        }}>
          {raceState}
        </div>
      </div>

      {events.length > 0 && (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px" }}>RECENT EVENTS</div>
          <div style={{ fontSize: "0.9rem", color: "#fff" }}>
            {events.map((event, idx) => (
              <div key={idx} style={{ marginBottom: "2px" }}>
                {formatEvent(event)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getRaceStateColor(state: RaceState): string {
  switch (state) {
    case "CREATED":
      return "#95a5a6"
    case "COUNTDOWN":
      return "#f39c12"
    case "LIVE":
      return "#e94560"
    case "PAUSED":
      return "#f1c40f"
    case "FINISHED":
      return "#2ecc71"
    case "ABORTED":
      return "#e74c3c"
    default:
      return "#fff"
  }
}

function formatEvent(event: string): string {
  const [type, playerId] = event.split(":")
  return `${type}${playerId ? ` (${playerId})` : ""}`
}

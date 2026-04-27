import { useEffect, useState } from "react"
import { store } from "../state/store"

export default function HUD() {
  const [speed, setSpeed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [rank, setRank] = useState(0)

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState()
      const selfPlayer = state.selfPlayerId ? state.players.get(state.selfPlayerId) : null
      
      if (selfPlayer) {
        setSpeed(selfPlayer.speed)
        setProgress(selfPlayer.progress)
      }

      const selfEntry = state.leaderboard.find(e => e.playerId === state.selfPlayerId)
      if (selfEntry) {
        setRank(selfEntry.rank)
      }
    })

    return unsubscribe
  }, [])

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      left: "20px",
      background: "rgba(26, 26, 46, 0.9)",
      padding: "20px",
      borderRadius: "12px",
      color: "#fff",
      fontFamily: "sans-serif",
      minWidth: "200px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)"
    }}>
      <div style={{ marginBottom: "15px" }}>
        <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px" }}>SPEED</div>
        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#feca57" }}>
          {speed.toFixed(0)}
          <span style={{ fontSize: "1rem", color: "#888" }}> km/h</span>
        </div>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px" }}>PROGRESS</div>
        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#e94560" }}>
          {(progress * 100).toFixed(0)}
          <span style={{ fontSize: "1rem", color: "#888" }}>%</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px" }}>RANK</div>
        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#00d2d3" }}>
          #{rank}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from "react"
import { LeaderboardEntry } from "@race-wars/shared"
import { store } from "../state/store"

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selfPlayerId, setSelfPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState()
      setLeaderboard(state.leaderboard)
      setSelfPlayerId(state.selfPlayerId)
    })

    return unsubscribe
  }, [])

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      background: "rgba(26, 26, 46, 0.9)",
      padding: "20px",
      borderRadius: "12px",
      color: "#fff",
      fontFamily: "sans-serif",
      minWidth: "250px",
      maxHeight: "400px",
      overflowY: "auto",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)"
    }}>
      <h3 style={{ 
        margin: "0 0 15px 0", 
        fontSize: "1.2rem", 
        color: "#feca57",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        paddingBottom: "10px"
      }}>
        Leaderboard
      </h3>
      
      {leaderboard.length === 0 ? (
        <div style={{ color: "#888", textAlign: "center", padding: "20px" }}>
          No players yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {leaderboard.map((entry) => (
            <div
              key={entry.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px",
                borderRadius: "8px",
                background: entry.playerId === selfPlayerId 
                  ? "rgba(254, 202, 87, 0.2)" 
                  : "rgba(255, 255, 255, 0.05)",
                border: entry.playerId === selfPlayerId 
                  ? "1px solid #feca57" 
                  : "1px solid transparent"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: getRankColor(entry.rank),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "0.9rem"
                }}>
                  {entry.rank}
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>{entry.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>
                    {entry.finished ? "Finished" : `${(entry.progress * 100).toFixed(1)}%`}
                  </div>
                </div>
              </div>
              {entry.finished && entry.finishTime && (
                <div style={{ fontSize: "0.8rem", color: "#2ecc71" }}>
                  {formatTime(entry.finishTime)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getRankColor(rank: number): string {
  if (rank === 1) return "#f1c40f" // Gold
  if (rank === 2) return "#95a5a6" // Silver
  if (rank === 3) return "#cd7f32" // Bronze
  return "#3498db" // Blue
}

function formatTime(timestamp: number): string {
  const minutes = Math.floor(timestamp / 60000)
  const seconds = Math.floor((timestamp % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

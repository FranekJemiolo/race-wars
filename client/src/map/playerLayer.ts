import L from "leaflet"
import { Player } from "@race-wars/shared"
import { getMap } from "./map"

const playerMarkers = new Map<string, L.Marker>()
const playerInterpolatedPositions = new Map<string, { lat: number; lon: number; timestamp: number }>()

export function updatePlayerMarkers(players: Player[], selfPlayerId: string | null): void {
  const map = getMap()
  if (!map) return

  const now = Date.now()

  players.forEach(player => {
    const existingMarker = playerMarkers.get(player.id)
    const isSelf = player.id === selfPlayerId

    // Interpolate position for smooth rendering
    const interpolated = interpolatePosition(player, now)
    
    if (existingMarker) {
      // Update existing marker
      existingMarker.setLatLng([interpolated.lat, interpolated.lon])
    } else {
      // Create new marker
      const marker = createPlayerMarker(player, isSelf)
      marker.addTo(map)
      playerMarkers.set(player.id, marker)
    }
  })

  // Remove markers for players no longer in the list
  const currentPlayerIds = new Set(players.map(p => p.id))
  playerMarkers.forEach((marker, playerId) => {
    if (!currentPlayerIds.has(playerId)) {
      map.removeLayer(marker)
      playerMarkers.delete(playerId)
    }
  })
}

function createPlayerMarker(player: Player, isSelf: boolean): L.Marker {
  const color = isSelf ? "#feca57" : "#3498db"
  
  const icon = L.divIcon({
    className: "player-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid ${isSelf ? '#fff' : '#000'};
        border-radius: 50%;
        box-shadow: 0 0 10px ${color};
        ${isSelf ? 'box-shadow: 0 0 20px #feca57, 0 0 10px #feca57;' : ''}
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })

  const marker = L.marker([player.projectedPosition.lat, player.projectedPosition.lon], {
    icon
  })

  // Add popup with player info
  marker.bindPopup(`
    <div style="font-family: sans-serif;">
      <strong>${player.name}</strong><br>
      Speed: ${player.speed.toFixed(1)} km/h<br>
      Progress: ${(player.progress * 100).toFixed(1)}%
    </div>
  `)

  return marker
}

function interpolatePosition(player: Player, now: number): { lat: number; lon: number } {
  const lastInterpolated = playerInterpolatedPositions.get(player.id)
  
  if (!lastInterpolated) {
    return player.projectedPosition
  }

  const timeDelta = now - lastInterpolated.timestamp
  const maxInterpolationTime = 200 // 200ms max interpolation

  if (timeDelta > maxInterpolationTime) {
    return player.projectedPosition
  }

  // Simple linear interpolation
  const t = timeDelta / maxInterpolationTime
  const lat = lastInterpolated.lat + (player.projectedPosition.lat - lastInterpolated.lat) * t
  const lon = lastInterpolated.lon + (player.projectedPosition.lon - lastInterpolated.lon) * t

  return { lat, lon }
}

export function clearPlayerMarkers(): void {
  const map = getMap()
  if (!map) return

  playerMarkers.forEach(marker => {
    map.removeLayer(marker)
  })
  playerMarkers.clear()
  playerInterpolatedPositions.clear()
}

export function centerOnPlayer(playerId: string): void {
  const marker = playerMarkers.get(playerId)
  const map = getMap()
  if (marker && map) {
    map.setView(marker.getLatLng(), 16)
  }
}

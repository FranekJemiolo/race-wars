import L from "leaflet"
import { Checkpoint } from "@race-wars/shared"
import { getMap } from "./map"

const checkpointMarkers = new Map<string, L.CircleMarker>()

export function drawCheckpoints(checkpoints: Checkpoint[], passedCheckpoints: Set<string>): void {
  const map = getMap()
  if (!map) return

  checkpoints.forEach(checkpoint => {
    const isPassed = passedCheckpoints.has(checkpoint.id)
    const existingMarker = checkpointMarkers.get(checkpoint.id)

    if (existingMarker) {
      // Update existing marker
      existingMarker.setStyle({
        color: isPassed ? "#2ecc71" : "#00d2d3",
        fillColor: isPassed ? "#2ecc71" : "#00d2d3",
        fillOpacity: isPassed ? 0.5 : 0.3
      })
    } else {
      // Create new marker
      const marker = L.circleMarker([checkpoint.position.lat, checkpoint.position.lon], {
        radius: checkpoint.radius,
        color: isPassed ? "#2ecc71" : "#00d2d3",
        fillColor: isPassed ? "#2ecc71" : "#00d2d3",
        fillOpacity: isPassed ? 0.5 : 0.3,
        weight: 3
      })

      marker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong>Checkpoint ${checkpoint.index + 1}</strong><br>
          ${isPassed ? "✓ Passed" : "○ Not passed"}
        </div>
      `)

      marker.addTo(map)
      checkpointMarkers.set(checkpoint.id, marker)
    }
  })
}

export function clearCheckpoints(): void {
  const map = getMap()
  if (!map) return

  checkpointMarkers.forEach(marker => {
    map.removeLayer(marker)
  })
  checkpointMarkers.clear()
}

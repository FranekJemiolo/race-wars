import L from "leaflet"
import { LatLng } from "@race-wars/shared"
import { getMap } from "./map"

let routePolyline: L.Polyline | null = null
let startLine: L.Polyline | null = null
let finishLine: L.Polyline | null = null

export function drawRoute(points: LatLng[]): void {
  const map = getMap()
  if (!map) return

  // Remove existing route
  if (routePolyline) {
    map.removeLayer(routePolyline)
  }

  // Create new route polyline
  const latLngs = points.map(p => [p.lat, p.lon] as [number, number])
  routePolyline = L.polyline(latLngs, {
    color: "#e94560",
    weight: 5,
    opacity: 0.8
  }).addTo(map)

  // Fit map to route bounds
  if (latLngs.length > 0) {
    const bounds = L.latLngBounds(latLngs)
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}

export function drawStartLine(start: LatLng, end: LatLng): void {
  const map = getMap()
  if (!map) return

  if (startLine) {
    map.removeLayer(startLine)
  }

  startLine = L.polyline([[start.lat, start.lon], [end.lat, end.lon]], {
    color: "#2ecc71",
    weight: 4,
    opacity: 0.8,
    dashArray: "10, 10"
  }).addTo(map)
}

export function drawFinishLine(start: LatLng, end: LatLng): void {
  const map = getMap()
  if (!map) return

  if (finishLine) {
    map.removeLayer(finishLine)
  }

  finishLine = L.polyline([[start.lat, start.lon], [end.lat, end.lon]], {
    color: "#f1c40f",
    weight: 4,
    opacity: 0.8,
    dashArray: "5, 5"
  }).addTo(map)
}

export function clearRoute(): void {
  const map = getMap()
  if (!map) return

  if (routePolyline) {
    map.removeLayer(routePolyline)
    routePolyline = null
  }
  if (startLine) {
    map.removeLayer(startLine)
    startLine = null
  }
  if (finishLine) {
    map.removeLayer(finishLine)
    finishLine = null
  }
}

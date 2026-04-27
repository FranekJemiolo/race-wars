import L from "leaflet"

let map: L.Map | null = null

export function initializeMap(containerId: string = "map"): L.Map {
  if (map) {
    return map
  }

  map = L.map(containerId).setView([51.505, -0.09], 13)

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(map)

  return map
}

export function getMap(): L.Map | null {
  return map
}

export function destroyMap(): void {
  if (map) {
    map.remove()
    map = null
  }
}

export function setView(lat: number, lon: number, zoom: number = 16): void {
  if (map) {
    map.setView([lat, lon], zoom)
  }
}

export function fitBounds(bounds: L.LatLngBounds): void {
  if (map) {
    map.fitBounds(bounds)
  }
}

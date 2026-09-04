# Race Wars — Visual Interface Documentation & Screenshots

## Overview
Race Wars features a modern dark cockpit telemetry design system optimized for high-speed racing environments, high contrast visibility in bright sunlight or nighttime sessions, and low-latency real-time updates.

This document showcases the full suite of mobile and desktop interfaces, captured directly from the live telemetry application.

---

## 🏎️ Live Racing Interface

The primary cockpit HUD designed for drivers during live track sessions. Features real-time GPS positioning, split-second lap timing, sector deltas, speed telemetry, and live position leaderboards.

### Desktop Cockpit View
![Desktop Live Racing Interface](assets/desktop-racing.png)

### Mobile Cockpit View
<p align="center">
  <img src="assets/mobile-racing.png" alt="Mobile Live Racing Interface" width="360" />
</p>

**Key Capabilities:**
- **Real-Time GPS Tracking**: 10Hz GPS interpolation with Kalman smoothing and track centerline projection.
- **Dynamic Leaderboard**: Live sector-by-sector time deltas and position changes.
- **High-Visibility HUD**: Large speed and lap indicators with color-coded sector pace (Green = Personal Best, Purple = Session Best, Amber = Caution).

---

## 🎬 Race Replay & Spectator System

A multi-angle telemetry playback suite allowing drivers, coaches, and spectators to review races with synchronized GPS mapping, speed profiles, and sector analysis.

### Desktop Replay View
![Desktop Race Replay](assets/desktop-race-replay.png)

### Mobile Replay View
<p align="center">
  <img src="assets/mobile-race-replay.png" alt="Mobile Race Replay" width="360" />
</p>

**Key Capabilities:**
- **Interactive Scrubber**: Timeline navigation with 0.5x to 4x variable playback speeds, fast skip (±10s), and frame stepping.
- **Vector Track Map**: Scalable SVG vector circuit overlay tracking driver positions, gap metrics, and corner apex speeds.
- **Telemetry Breakdown**: Sector-by-sector split analysis, top speed markers, and incident timestamps.

---

## 📢 Race Admin & Stewards Panel

The control room dashboard for race directors and track marshals to manage active sessions, broadcast emergency flags, deploy safety cars, and adjudicate on-track incidents.

### Desktop Admin Console
![Desktop Admin Panel](assets/desktop-admin-panel.png)

### Mobile Marshal View
<p align="center">
  <img src="assets/mobile-admin-panel.png" alt="Mobile Admin Panel" width="360" />
</p>

**Key Capabilities:**
- **Instant Flag Dispatch**: Single-tap session status broadcasting (Green Flag, Full Course Yellow, Safety Car, Red Flag, Chequered Flag).
- **Incident Logging & Adjudication**: Real-time stewards feed tracking track limit violations, penalties, and marshal notes.
- **Session Control**: Rapid driver communication, penalty assignments (time additions, drive-throughs), and track status telemetry.

---

## 🏢 Team Management & Telemetry Hub

Strategic headquarters for racing teams. Manage driver rosters, analyze seasonal standings, monitor car setups, and review competition statistics.

### Desktop Team Dashboard
![Desktop Team Management](assets/desktop-team-management.png)

### Mobile Team Management
<p align="center">
  <img src="assets/mobile-team-management.png" alt="Mobile Team Management" width="360" />
</p>

**Key Capabilities:**
- **Team Roster & Roles**: Manage leaders, strategists, and active drivers with skill ratings and win ratios.
- **Seasonal Standings**: Dynamic points tracking across sprint races, endurance events, and time attack cups.
- **Quick Actions**: One-touch roster invites, team setup adjustments, and direct communication links.

---

## 💬 Team Pitwall Chat & Radio

Encrypted pitwall communication interface for real-time race engineering, pit strategy coordination, driver reactions, and automated race control alerts.

### Desktop Team Chat
![Desktop Team Chat](assets/desktop-team-chat.png)

### Mobile Team Chat
<p align="center">
  <img src="assets/mobile-team-chat.png" alt="Mobile Team Chat" width="360" />
</p>

**Key Capabilities:**
- **Real-Time WebSockets**: Instant strategy messaging between pit crew and drivers.
- **System Event Broadcasts**: Automatic race events, penalty announcements, and fastest lap alerts delivered into the team feed.
- **Reaction Matrix**: Quick driver acknowledgments and feedback triggers with emoji reactions.

---

## 🗺️ OpenStreetMap Route Builder & Live GPS Tracking

Race Wars is built on an OpenStreetMap geospatial core powered by Leaflet and Turf.js. Drivers, track designers, and race organizers can draw custom circuits or point-to-point stages, place checkpoints, and track real-time vehicle coordinates on live OpenStreetMap tiles.

### OpenStreetMap Route Builder
![Route Builder](assets/route-builder.png)

### Live Circuit GPS Tracking on OpenStreetMap
![Live Race Map](assets/racing-view-with-map.png)

### Spectator Circuit Overview
![Spectating View](assets/spectating-view.png)

**Key Capabilities:**
- **OpenStreetMap Polyline Drawing**: Draw custom circuits directly on OpenStreetMap tiles with automatic distance, lap, and elevation calculations.
- **Turf.js Geometry Projection**: Projects noisy GPS coordinates onto track polylines with 5m precision.
- **Live Multi-Vehicle Tracking**: Live driver markers, start/finish lines, sector gates, and split times on real-world street and track maps.

---

## 🎨 Design System Specifications

### Cockpit Color Palette
- **Background Cockpit**: `#090d16` (Deep space cockpit base)
- **Card Background**: `rgba(13, 19, 33, 0.85)` with cyan border `rgba(0, 212, 255, 0.2)`
- **Telemetry Neon Green**: `#00ff88` (Pace, personal best, green flag)
- **Telemetry Neon Cyan**: `#00d4ff` (Navigation, primary brand, timing)
- **Telemetry Caution Amber**: `#ffaa00` (Yellow flags, warnings, sector cautions)
- **Telemetry Danger Red**: `#ff3366` (Red flags, penalties, incident markers)
- **Telemetry Sector Purple**: `#bb44ff` (Overall session best laps)

### Typography
- **HUD & Telemetry Headers**: `'Orbitron', -apple-system, sans-serif`
- **Timing & Numerical Readouts**: `'JetBrains Mono', monospace`
- **Body & Strategy Copy**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`

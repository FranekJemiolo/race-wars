# 🏁 Race Wars

<div align="center">
  
  **Real-time multiplayer GPS racing engine for closed-road/track racing events**
  
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://franekjemiolo.github.io/race-wars/)
  [![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-61DAFB?logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js)](https://nodejs.org/)
</div>

## 🎯 Overview

Race Wars is a comprehensive web-based racing platform that transforms GPS data into competitive multiplayer racing experiences. It features advanced team-based racing, real-time leaderboards, race replays, and mobile-optimized interfaces.

**Core Concept**: GPS → smoothing → projection → progress → ranking → broadcast → UI

## ✨ Key Features

### 🏁 Racing Core
- **Custom Route Builder**: Draw race routes on OpenStreetMap or import GPX files
- **GPS Projection Engine**: Advanced geometry engine with 5m accuracy using Turf.js
- **Live Leaderboard**: Real-time ranking with sub-second updates
- **Safety Awareness**: Hazard zone system and route deviation detection
- **Real-Time Sync**: WebSocket-based architecture with 1-2Hz updates

### 👥 Team-Based Racing
- **Team Management**: Create, join, and manage racing teams with roles and permissions
- **Team Leaderboards**: Competitive rankings across multiple competition types
- **Team Communication**: Real-time chat with reactions and coordination features
- **Team Competitions**: Seasonal, tournament, and championship formats
- **Team Analytics**: Performance metrics, achievements, and statistics

### 📱 Mobile Optimization
- **Mobile-First Design**: Progressive Web App with offline map caching
- **Touch Interface**: Optimized for mobile devices with gesture support
- **Responsive Layout**: Seamless experience across all screen sizes
- **Push Notifications**: Real-time alerts and race updates

### 🎬 Advanced Features
- **Race Replay System**: Video-like playback with analysis tools
- **Predefined Routes**: Famous circuits (Monaco, Silverstone, Spa, etc.)
- **Admin Event System**: Real-time race management and communication
- **Anti-Cheat Detection**: Advanced GPS validation and pattern analysis
- **Comprehensive Testing**: 45+ E2E tests covering all functionality

## 📸 App Screenshots & Interface Showcase

Race Wars features a modern dark cockpit telemetry design system with high-contrast neon accents, built for real-time tracking, sub-second leaderboards, and seamless desktop and mobile workflows.

> 📖 **Full Visual Guide**: Explore the complete [Visual Interface & Screenshots Guide](docs/screenshots.md), the [Interactive Web Showcase](https://franekjemiolo.github.io/race-wars/), the [Driver Cockpit Guide](docs/DRIVER_GUIDE.md), and the [Admin & Stewards Guide](docs/ADMIN_GUIDE.md).

### 🏎️ Live Racing Cockpit HUD
*Real-time GPS tracking with 10Hz interpolation, live delta timing, sector pace indicators, and dynamic leaderboards.*

| Desktop Cockpit View | Mobile Cockpit View |
| :---: | :---: |
| ![Desktop Live Racing](docs/assets/desktop-racing.png) | <img src="docs/assets/mobile-racing.png" alt="Mobile Live Racing" width="300" /> |

---

### 🎬 Race Replay & Telemetry Playback
*Multi-angle synchronized GPS playback with timeline scrubbing, variable speeds (0.5x–4x), vector circuit map, and lap analysis.*

| Desktop Replay View | Mobile Replay View |
| :---: | :---: |
| ![Desktop Race Replay](docs/assets/desktop-race-replay.png) | <img src="docs/assets/mobile-race-replay.png" alt="Mobile Race Replay" width="300" /> |

---

### 📢 Race Admin & Stewards Control Panel
*Session control room for race directors: instant flag dispatch (Green, FCY, Safety Car, Red), penalty management, and steward incident feed.*

| Desktop Admin Console | Mobile Marshal View |
| :---: | :---: |
| ![Desktop Admin Panel](docs/assets/desktop-admin-panel.png) | <img src="docs/assets/mobile-admin-panel.png" alt="Mobile Admin Panel" width="300" /> |

---

### 🏢 Team Management & Telemetry Hub
*Strategic headquarters for racing teams: driver rosters, seasonal standings, skill ratings, car setup specs, and competition statistics.*

| Desktop Team Dashboard | Mobile Team View |
| :---: | :---: |
| ![Desktop Team Management](docs/assets/desktop-team-management.png) | <img src="docs/assets/mobile-team-management.png" alt="Mobile Team Management" width="300" /> |

---

### 💬 Team Pitwall Chat & Radio
*Encrypted real-time pitwall strategy messaging, driver reactions, automated race control alerts, and telemetry updates.*

| Desktop Team Chat | Mobile Team Chat |
| :---: | :---: |
| ![Desktop Team Chat](docs/assets/desktop-team-chat.png) | <img src="docs/assets/mobile-team-chat.png" alt="Mobile Team Chat" width="300" /> |

---

### 🗺️ OpenStreetMap Route Builder & Circuit Designer
*Interactive circuit and stage designer built on OpenStreetMap tiles. Create custom race tracks, place waypoints and checkpoints, define start/finish lines, and compute track distance, elevation profiles, and estimated lap times.*

| OpenStreetMap Route Builder |
| :---: |
| ![OpenStreetMap Route Builder](docs/assets/route-builder.png) |

---

### 📍 OpenStreetMap Live Circuit & Spectator Tracking
*Full-track GPS telemetry tracking rendered over OpenStreetMap tiles using Leaflet and Turf.js geometry projection. Displays real-time driver coordinates, course progress, waypoint status, and gap leaderboards.*

| Live Race GPS Tracking on OpenStreetMap | Spectator Circuit Overview |
| :---: | :---: |
| ![Live Race Map](docs/assets/racing-view-with-map.png) | ![Spectating View](docs/assets/spectating-view.png) |

---

### 🎯 Key Interface Features

- **📱 Mobile-First Responsive Design**: Touch-optimized telemetry HUD and cockpit controls built for on-track mounting
- **💻 Desktop Strategy Dashboard**: Multi-panel command center for telemetry, race control, and roster management
- **🗺️ Interactive Circuit Maps**: High-precision vector circuit overlays with dynamic driver positions and speed apex markers
- **📊 Live Leaderboard & Deltas**: Sub-second timing updates with color-coded sector pace (Green = PB, Purple = Session Best)
- **💬 Pitwall Strategy Chat**: Instant WebSocket messaging with reaction matrix and race control broadcast integration
- **🎬 Telemetry Replay Engine**: Video-like timeline scrubbing with variable playback speeds and incident breakdown
- **📢 Real-Time Flag Dispatch**: Single-tap flag broadcasting and steward incident adjudication
- **🏆 Team System**: Roster management, skill metrics, and seasonal championship tracking

All screenshots are generated using automated Playwright sessions capturing the active telemetry application interface and cockpit design system.

## 🛠️ Tech Stack

- **Server**: TypeScript (Node.js) + Turf.js + WebSockets
- **Client**: React + Vite + Leaflet + TypeScript + Tailwind CSS
- **Shared**: TypeScript types and protocol definitions
- **Testing**: Comprehensive E2E test suite with 45+ tests
- **Mobile**: PWA with offline capabilities and touch optimization
- **Database**: PostgreSQL (production) with SQLite fallback (local dev)

## 🏗️ Architecture

The system uses a monorepo structure:

```
/race-wars
  /shared      # Shared types and protocol
  /server      # Node.js WebSocket server
  /client      # React web application
  /test        # Comprehensive E2E test suite
  /assets      # AI-generated assets
  /docs        # GitHub Pages documentation
  /journal     # Implementation journal
```

### Architecture Diagram

```mermaid
graph TD
    subgraph "Monorepo Structure"
        A[Shared Types] --> B[Server]
        A --> C[Client]
        D[Test Suite] --> B
        D --> C
    end
    
    subgraph "Server (Node.js)"
        B --> E[WebSocket Server]
        B --> F[GPS Engine]
        B --> G[Team Manager]
        B --> H[Race Manager]
        B --> I[Database Layer]
        
        E --> J[Real-time Sync]
        F --> K[GPS Projection]
        F --> L[Route Builder]
        G --> M[Team System]
        G --> N[Chat System]
        H --> O[Race Events]
        H --> P[Leaderboard]
        I --> Q[PostgreSQL]
        I --> R[SQLite Fallback]
    end
    
    subgraph "Client (React)"
        C --> S[Mobile App]
        C --> T[Desktop App]
        C --> U[PWA Features]
        
        S --> V[GPS Tracking]
        S --> W[Touch Interface]
        S --> X[Offline Maps]
        T --> Y[Admin Console]
        T --> Z[Route Builder]
        T --> AA[Analytics]
        U --> BB[Push Notifications]
        U --> CC[Cache Management]
    end
    
    subgraph "GPS Processing Pipeline"
        K --> DD[Raw GPS Data]
        DD --> EE[Smoothing Filter]
        EE --> FF[Turf.js Projection]
        FF --> GG[Route Progress]
        GG --> HH[Position Calculation]
        HH --> II[Ranking Update]
    end
    
    subgraph "Team System"
        M --> JJ[Team Creation]
        M --> KK[Member Management]
        M --> LL[Permissions]
        M --> MM[Team Chat]
        N --> NN[Real-time Messages]
        N --> OO[Reactions]
        N --> PP[File Sharing]
    end
    
    subgraph "Race Management"
        O --> QQ[Race Creation]
        O --> RR[Route Setup]
        O --> SS[Participant Management]
        P --> TT[Live Leaderboard]
        P --> UU[Progress Tracking]
        P --> VV[Ranking Algorithm]
    end
    
    subgraph "Advanced Features"
        WW[Race Replay] --> XX[Session Recording]
        WW --> YY[Playback Engine]
        WW --> ZZ[Analysis Tools]
        AAA[Anti-Cheat] --> BBB[GPS Validation]
        AAA --> CCC[Pattern Analysis]
        AAA --> DDD[Anomaly Detection]
    end
    
    subgraph "Testing Infrastructure"
        D --> EE[E2E Tests]
        D --> FF[Mobile Tests]
        D --> GG[Desktop Tests]
        D --> HH[API Tests]
        EE --> II[Playwright]
        FF --> JJ[Touch Simulation]
        GG --> KK[Browser Automation]
        HH --> LL[WebSocket Testing]
    end
    
    subgraph "Data Flow"
        MM --> NN
        NN --> E
        E --> J
        J --> S
        J --> T
        V --> DD
        DD --> II
        II --> P
        P --> TT
        TT --> S
    end
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 15+ (optional - falls back to SQLite for local dev)

### Installation

```bash
# Clone the repository
git clone https://github.com/FranekJemiolo/race-wars.git
cd race-wars

# Install dependencies
npm install
```

### Client Configuration

The client uses Vite with Tailwind CSS for styling. Configuration files:

- **`client/vite.config.ts`** - Vite build configuration with PostCSS support
- **`client/tailwind.config.js`** - Tailwind CSS configuration
- **`client/postcss.config.js`** - PostCSS configuration for Tailwind and autoprefixer
- **`client/package.json`** - Client dependencies and scripts

The client runs on port 5177 by default and proxies API requests to the server on port 8080.

### Database Configuration

The project supports two database options:

**SQLite (Default for Local Development)**
- Location: `data/race_wars.db`
- Automatically created if not present
- Perfect for quick development and testing
- No additional setup required

**PostgreSQL (Production-like)**
- Requires PostgreSQL 15+ with PostGIS extension
- Set `DATABASE_URL` environment variable
- Example: `postgresql://race_wars:password@localhost:5432/race_wars`
- Supports spatial queries and advanced features

The application automatically falls back to SQLite if PostgreSQL is not available.

### Development

```bash
# Start the server (port 8080)
npm run dev:server

# Start the client (port 5177)
npm run dev:client

# Or start both at once
npm run dev
```

### Build

```bash
# Build all packages
npm run build
```

## Documentation

- [Implementation Plan](journal/IMPLEMENTATION_PLAN.md) - Detailed implementation roadmap
- [GitHub Pages](https://franekjemiolo.github.io/race-wars/) - Live documentation and UI mockup

## Status

**In Development** - This project is currently under active development. Check the journal directory for detailed implementation progress.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read the implementation plan and open an issue for discussion before submitting PRs.

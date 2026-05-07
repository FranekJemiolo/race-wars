# 🏁 Race Wars

<div align="center">
  <img src="docs/assets/logo.png" alt="Race Wars Logo" width="200"/>
  
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

## 📸 App Screenshots

### 📱 Mobile Interface

**Race Selection (Mobile)**
![Mobile Race Selection](docs/assets/mobile-race-selection.png)
*Mobile race selection screen displaying available races*

**Mobile Racing Interface**
![Mobile Racing Interface](docs/assets/mobile-racing-interface.png)
*Live racing view optimized for mobile devices*

**Mobile Team Management**
![Mobile Team Management](docs/assets/mobile-team-management.png)
*Team management interface on mobile*

### 💻 Desktop Interface

**Connection Screen**
![Connection Screen](docs/assets/connection-screen.png)
*Server connection interface with available servers and quick connect options*

**Race Selection**
![Race Selection](docs/assets/race-selection.png)
*Race selection screen displaying available races with filters, search, and sorting options*

**Race Creation**
![Race Creation](docs/assets/race-creation.png)
*Race creation interface for configuring new races with track and participant settings*

**Admin Console**
![Admin Console](docs/assets/admin-console.png)
*Administrative panel for managing races, users, and system settings*

**Admin Panel**
![Admin Panel](docs/assets/admin-panel.png)
*Advanced admin controls for race management*

**Leaderboard**
![Leaderboard](docs/assets/leaderboard.png)
*Real-time leaderboard showing race rankings*

**Live Racing Interface**
![Live Racing Interface](docs/assets/live-racing-interface.png)
*Live racing view with GPS tracking and real-time updates*

**Racing View**
![Racing View](docs/assets/racing-view.png)
*Desktop racing interface with map and participant tracking*

**Racing View with Map**
![Racing View with Map](docs/assets/racing-view-with-map.png)
*Live race map showing driver positions on track with real-time leaderboard*

**Route Builder**
![Route Builder](docs/assets/route-builder.png)
*Custom route builder for creating race tracks*

**Race Replay System**
![Race Replay System](docs/assets/race-replay-system.png)
*Race replay system for analyzing past races*

**Spectating View**
![Spectating View](docs/assets/spectating-view.png)
*Spectator mode for watching live races*

**Team Dashboard**
![Team Dashboard](docs/assets/team-dashboard.png)
*Team management dashboard with analytics*

**App Showcase**
![App Showcase](docs/assets/showcase-main.png)
*Full application showcase demonstrating the race selection interface*

---

### 🎯 Key Interface Features

- **📱 Mobile-First Design**: Touch-optimized interfaces for on-the-go racing
- **💻 Desktop Dashboard**: Comprehensive management and analytics tools
- **🗺️ Interactive Maps**: Real-time GPS tracking with OpenStreetMap integration
- **📊 Live Leaderboards**: Sub-second updates with advanced statistics
- **💬 Team Communication**: Real-time chat with reactions and achievements
- **🎬 Race Replay**: Video-like playback with detailed analysis tools
- **📢 Admin Controls**: Real-time event management and broadcasting
- **🏆 Team Management**: Create, join, and manage racing teams

All screenshots are generated using Playwright automation to showcase the actual application interface and user experience.

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

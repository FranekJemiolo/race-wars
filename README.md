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
- **Client**: React + Vite + Leaflet + TypeScript
- **Shared**: TypeScript types and protocol definitions
- **Testing**: Comprehensive E2E test suite with 45+ tests
- **Mobile**: PWA with offline capabilities and touch optimization

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

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/FranekJemiolo/race-wars.git
cd race-wars

# Install dependencies
npm install
```

### Development

```bash
# Start the server (port 8080)
npm run dev:server

# Start the client (port 5173)
npm run dev:client
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

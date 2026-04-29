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

## 🖼️ App Screenshots

### 📱 Mobile Interface

<div align="center">
  <h4>🏁 Mobile Team Management</h4>
  <img src="docs/assets/mobile-team-management.png" alt="Mobile Team Management" width="300"/>
  <p><em>Touch-friendly team interface with real-time stats and quick actions</em></p>
</div>

<div align="center">
  <h4>🏁 Live Racing Interface</h4>
  <img src="docs/assets/mobile-racing.png" alt="Mobile Racing" width="300"/>
  <p><em>Real-time GPS racing with live position tracking and leaderboard</em></p>
</div>

<div align="center">
  <h4>💬 Team Chat</h4>
  <img src="docs/assets/mobile-chat.png" alt="Mobile Team Chat" width="300"/>
  <p><em>Real-time team communication with reactions and achievements</em></p>
</div>

### 💻 Desktop Interface

<div align="center">
  <h4>🏁 Desktop Team Dashboard</h4>
  <img src="docs/assets/desktop-team-dashboard.png" alt="Desktop Team Dashboard" width="600"/>
  <p><em>Comprehensive team management with analytics and member statistics</em></p>
</div>

<div align="center">
  <h4>🎬 Race Replay System</h4>
  <img src="docs/assets/desktop-race-replay.png" alt="Race Replay" width="600"/>
  <p><em>Advanced race replay with video controls and detailed analysis</em></p>
</div>

<div align="center">
  <h4>📢 Admin Event Panel</h4>
  <img src="docs/assets/desktop-admin-panel.png" alt="Admin Panel" width="600"/>
  <p><em>Real-time race management with event broadcasting and analytics</em></p>
</div>

*For detailed visual mockups and interface descriptions, see our [Screenshots Documentation](docs/screenshots.md)*

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

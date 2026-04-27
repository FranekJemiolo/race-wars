# Race Wars

Real-time multiplayer GPS racing engine for closed-road/track racing events.

## Overview

Race Wars is a web-based system that transforms GPS data into competitive racing experiences. It projects GPS positions onto predefined route polylines, tracks progress, validates checkpoints, and maintains live leaderboards with sub-second accuracy.

**Core Concept**: GPS → smoothing → projection → progress → ranking → broadcast → UI

## Features

- **Custom Route Builder**: Draw race routes on OpenStreetMap or import GPX files
- **GPS Projection Engine**: Advanced geometry engine with 5m accuracy using Turf.js
- **Live Leaderboard**: Real-time ranking with sub-second updates
- **Safety Awareness**: Hazard zone system and route deviation detection
- **Mobile-First Design**: Progressive Web App with offline map caching
- **Real-Time Sync**: WebSocket-based architecture with 1-2Hz updates

## Tech Stack

- **Server**: TypeScript (Node.js) + Turf.js + WebSockets
- **Client**: React + Vite + Leaflet + TypeScript
- **Shared**: TypeScript types and protocol definitions

## Architecture

The system uses a monorepo structure:

```
/race-wars
  /shared      # Shared types and protocol
  /server      # Node.js WebSocket server
  /client      # React web application
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

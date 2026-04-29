# Local Development Setup

This guide will help you set up a complete local development environment for Race Wars with all services running in Docker containers.

## Quick Start

### 1. Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- Node.js 18+ (for local development outside Docker)
- Git

### 2. Basic Setup

```bash
# Clone the repository
git clone https://github.com/FranekJemiolo/race-wars.git
cd race-wars

# Setup local environment
./scripts/local-setup.sh
```

This will start:
- ✅ Application server (http://localhost:8080)
- ✅ Client development server (http://localhost:3000)
- ✅ Nginx reverse proxy (http://localhost)
- ✅ PostgreSQL database (localhost:5432)
- ✅ Redis cache (localhost:6379)

### 3. With Monitoring Tools

```bash
# Setup with monitoring
./scripts/local-setup.sh true
```

Additional services:
- ✅ Prometheus (http://localhost:9090)
- ✅ Grafana (http://localhost:3001)

### 4. With Admin Tools

```bash
# Setup with monitoring and admin tools
./scripts/local-setup.sh true true
```

Additional services:
- ✅ pgAdmin (http://localhost:5050)
- ✅ Redis Commander (http://localhost:8082)

## Configuration

### Environment Variables

Copy the environment template and configure it:

```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

Key variables to configure:
- `REACT_APP_MAPBOX_TOKEN` - Mapbox access token for maps
- `OAUTH_GOOGLE_CLIENT_ID` - Google OAuth (optional)
- `OAUTH_GOOGLE_CLIENT_SECRET` - Google OAuth secret (optional)

### Database Configuration

The local setup uses:
- **Database**: `race_wars_dev`
- **User**: `race_wars`
- **Password**: `race_wars_dev`
- **Port**: 5432

## Services Overview

### Core Services

| Service | URL | Description |
|---------|-----|-------------|
| Application | http://localhost | Main application |
| API | http://localhost/api | REST API endpoints |
| WebSocket | ws://localhost/ws | WebSocket connections |
| Health Check | http://localhost/health | Service health status |

### Development Tools

| Tool | URL | Credentials |
|------|-----|-------------|
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3001 | admin/admin |
| pgAdmin | http://localhost:5050 | admin@racewars.local/admin |
| Redis Commander | http://localhost:8082 | - |

### Database Access

| Database | Host | Port | Database | User | Password |
|----------|------|------|----------|------|----------|
| PostgreSQL | localhost | 5432 | race_wars_dev | race_wars | race_wars_dev |
| Redis | localhost | 6379 | - | - | - |

## Development Workflow

### Starting Services

```bash
# Start core services only
docker-compose -f docker-compose.local.yml up -d

# Start with monitoring
docker-compose -f docker-compose.local.yml --profile monitoring up -d

# Start with admin tools
docker-compose -f docker-compose.local.yml --profile admin up -d

# Start everything
docker-compose -f docker-compose.local.yml --profile monitoring --profile admin up -d
```

### Viewing Logs

```bash
# View all logs
docker-compose -f docker-compose.local.yml logs -f

# View specific service logs
docker-compose -f docker-compose.local.yml logs -f server
docker-compose -f docker-compose.local.yml logs -f client
docker-compose -f docker-compose.local.yml logs -f postgres
```

### Accessing Containers

```bash
# Access server container
docker-compose -f docker-compose.local.yml exec server sh

# Access database container
docker-compose -f docker-compose.local.yml exec postgres psql -U race_wars -d race_wars_dev

# Access Redis container
docker-compose -f docker-compose.local.yml exec redis redis-cli
```

### Running Commands

```bash
# Run database migrations
docker-compose -f docker-compose.local.yml exec server npm run migrate

# Seed database with sample data
docker-compose -f docker-compose.local.yml exec server npm run seed

# Run tests
docker-compose -f docker-compose.local.yml exec server npm test
```

## Stopping Services

### Basic Stop

```bash
# Stop all services
docker-compose -f docker-compose.local.yml down
```

### Complete Cleanup

```bash
# Stop services and remove volumes
./scripts/local-teardown.sh --remove-volumes

# Stop services, remove volumes and images
./scripts/local-teardown.sh --clean-all
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 80, 3000, 5432, 6379 are available
2. **Docker not running**: Start Docker Desktop before running setup
3. **Permission issues**: Make sure scripts are executable (`chmod +x scripts/*.sh`)

### Health Checks

```bash
# Check if services are running
docker-compose -f docker-compose.local.yml ps

# Check application health
curl http://localhost/health

# Check API health
curl http://localhost/api/health
```

### Reset Database

```bash
# Reset database (removes all data)
docker-compose -f docker-compose.local.yml down
docker volume rm race-wars_postgres_local_data
docker-compose -f docker-compose.local.yml up -d postgres
./scripts/local-setup.sh
```

## Development Features

### Hot Reloading

- **Client**: React hot reload enabled
- **Server**: Nodemon watching for changes
- **Database**: Auto-reconnect on restart

### CORS Configuration

CORS is enabled for local development with:
- Allow all origins (`*`)
- Allow all methods
- Allow all headers

### Debug Mode

Debug mode is enabled with:
- Detailed logging
- Stack traces in errors
- Development error pages

## File Structure

```
race-wars/
├── docker-compose.local.yml     # Local development setup
├── .env.local.example           # Environment template
├── infrastructure/
│   └── nginx/
│       ├── nginx.local.conf     # Nginx configuration
│       └── logs/                # Nginx logs
├── scripts/
│   ├── local-setup.sh           # Setup script
│   └── local-teardown.sh       # Teardown script
└── database/
    ├── init/                    # Database initialization
    └── seed/                    # Sample data
```

## Security Notes

- This is a development environment only
- Default passwords are used for convenience
- SSL/TLS is disabled (HTTP only)
- CORS allows all origins
- Debug mode exposes sensitive information

**Never use this configuration in production!**

## Next Steps

1. Configure your Mapbox token in `.env.local`
2. Set up OAuth providers if needed
3. Explore the monitoring tools
4. Start developing your features
5. Run tests to verify everything works

## Support

If you encounter issues:

1. Check the logs: `docker-compose -f docker-compose.local.yml logs`
2. Verify prerequisites are installed
3. Ensure ports are available
4. Reset the environment if needed

For more information, see the main [README.md](README.md) file.

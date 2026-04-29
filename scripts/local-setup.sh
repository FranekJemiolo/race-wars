#!/bin/bash

# Local Development Setup Script
# Usage: ./scripts/local-setup.sh [options]

set -e

# Configuration
INCLUDE_MONITORING=${1:-false}
INCLUDE_ADMIN=${2:-false}
ENV_FILE=".env.local"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    
    success "Prerequisites check passed"
}

# Setup environment file
setup_environment() {
    log "Setting up environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        cp .env.local.example "$ENV_FILE"
        success "Environment file created: $ENV_FILE"
        warning "Please edit $ENV_FILE with your local configuration"
    else
        log "Environment file already exists: $ENV_FILE"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p infrastructure/nginx/logs
    mkdir -p infrastructure/nginx/ssl
    mkdir -p database/seed
    mkdir -p logs
    mkdir -p backups
    mkdir -p uploads
    
    success "Directories created"
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    # Build development images
    docker-compose -f docker-compose.local.yml build
    
    success "Docker images built successfully"
}

# Start core services
start_core_services() {
    log "Starting core services..."
    
    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    fi
    
    # Start core services
    docker-compose -f docker-compose.local.yml up -d postgres redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.local.yml exec -T postgres pg_isready -U race_wars -d race_wars_dev &>/dev/null; then
            break
        fi
        sleep 2
    done
    
    # Wait for Redis to be ready
    log "Waiting for Redis to be ready..."
    for i in {1..15}; do
        if docker-compose -f docker-compose.local.yml exec -T redis redis-cli ping &>/dev/null; then
            break
        fi
        sleep 2
    done
    
    # Start application services
    docker-compose -f docker-compose.local.yml up -d server client nginx
    
    success "Core services started"
}

# Start monitoring services (optional)
start_monitoring() {
    if [ "$INCLUDE_MONITORING" = "true" ]; then
        log "Starting monitoring services..."
        
        docker-compose -f docker-compose.local.yml --profile monitoring up -d prometheus grafana
        
        success "Monitoring services started"
        log "Prometheus: http://localhost:9090"
        log "Grafana: http://localhost:3001 (admin/admin)"
    fi
}

# Start admin services (optional)
start_admin() {
    if [ "$INCLUDE_ADMIN" = "true" ]; then
        log "Starting admin services..."
        
        docker-compose -f docker-compose.local.yml --profile admin up -d pgadmin redis-commander
        
        success "Admin services started"
        log "pgAdmin: http://localhost:5050 (admin@racewars.local/admin)"
        log "Redis Commander: http://localhost:8082"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait a bit for server to be ready
    sleep 10
    
    # Run migrations
    docker-compose -f docker-compose.local.yml exec server npm run migrate
    
    success "Database migrations completed"
}

# Seed database (optional)
seed_database() {
    log "Seeding database with sample data..."
    
    # Check if seed files exist
    if [ -d "./database/seed" ] && [ "$(ls -A ./database/seed)" ]; then
        docker-compose -f docker-compose.local.yml exec server npm run seed
        success "Database seeded with sample data"
    else
        log "No seed data found, skipping database seeding"
    fi
}

# Verify setup
verify_setup() {
    log "Verifying local setup..."
    
    # Check application health
    for i in {1..30}; do
        if curl -f http://localhost/health &>/dev/null; then
            success "Application is healthy"
            break
        fi
        sleep 2
    done
    
    # Check client accessibility
    if curl -f http://localhost &>/dev/null; then
        success "Client is accessible"
    else
        warning "Client might still be starting up"
    fi
    
    # Check API endpoints
    if curl -f http://localhost/api/health &>/dev/null; then
        success "API endpoints are accessible"
    else
        warning "API might still be starting up"
    fi
}

# Show access information
show_access_info() {
    log "Local development environment is ready!"
    echo ""
    echo -e "${GREEN}Access URLs:${NC}"
    echo -e "  • Application: ${BLUE}http://localhost${NC}"
    echo -e "  • API: ${BLUE}http://localhost/api${NC}"
    echo -e "  • WebSocket: ${BLUE}ws://localhost/ws${NC}"
    echo -e "  • Health Check: ${BLUE}http://localhost/health${NC}"
    
    if [ "$INCLUDE_MONITORING" = "true" ]; then
        echo ""
        echo -e "${GREEN}Monitoring:${NC}"
        echo -e "  • Prometheus: ${BLUE}http://localhost:9090${NC}"
        echo -e "  • Grafana: ${BLUE}http://localhost:3001${NC} (admin/admin)"
    fi
    
    if [ "$INCLUDE_ADMIN" = "true" ]; then
        echo ""
        echo -e "${GREEN}Admin Tools:${NC}"
        echo -e "  • pgAdmin: ${BLUE}http://localhost:5050${NC} (admin@racewars.local/admin)"
        echo -e "  • Redis Commander: ${BLUE}http://localhost:8082${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}Database Access:${NC}"
    echo -e "  • PostgreSQL: ${BLUE}localhost:5432${NC} (race_wars/race_wars_dev)"
    echo -e "  • Redis: ${BLUE}localhost:6379${NC}"
    
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo -e "  • View logs: ${BLUE}docker-compose -f docker-compose.local.yml logs -f${NC}"
    echo -e "  • Stop services: ${BLUE}docker-compose -f docker-compose.local.yml down${NC}"
    echo -e "  • Restart services: ${BLUE}docker-compose -f docker-compose.local.yml restart${NC}"
    echo -e "  • Access server shell: ${BLUE}docker-compose -f docker-compose.local.yml exec server sh${NC}"
}

# Main setup function
main() {
    log "Starting local development setup..."
    
    check_prerequisites
    setup_environment
    create_directories
    build_images
    start_core_services
    start_monitoring
    start_admin
    run_migrations
    seed_database
    verify_setup
    show_access_info
    
    success "Local development setup completed!"
}

# Handle script interruption
trap 'error "Setup interrupted"' INT TERM

# Run main function
main "$@"

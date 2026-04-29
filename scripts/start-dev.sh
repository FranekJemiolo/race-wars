#!/bin/bash

# Start Development Environment Script
# Usage: ./scripts/start-dev.sh [options]

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

# Show banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Race Wars Development                       ║"
    echo "║                      Environment Setup                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if environment exists
check_environment() {
    if [ ! -f "$ENV_FILE" ]; then
        warning "Environment file not found: $ENV_FILE"
        log "Creating from template..."
        cp .env.local.example "$ENV_FILE"
        success "Environment file created. Please edit $ENV_FILE if needed."
    fi
}

# Start services
start_services() {
    log "Starting development environment..."
    
    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    # Determine compose command based on options
    COMPOSE_CMD="docker-compose -f docker-compose.local.yml"
    
    if [ "$INCLUDE_MONITORING" = "true" ] && [ "$INCLUDE_ADMIN" = "true" ]; then
        log "Starting all services (core + monitoring + admin)..."
        $COMPOSE_CMD --profile monitoring --profile admin up -d
    elif [ "$INCLUDE_MONITORING" = "true" ]; then
        log "Starting services with monitoring..."
        $COMPOSE_CMD --profile monitoring up -d
    elif [ "$INCLUDE_ADMIN" = "true" ]; then
        log "Starting services with admin tools..."
        $COMPOSE_CMD --profile admin up -d
    else
        log "Starting core services..."
        $COMPOSE_CMD up -d
    fi
    
    success "Services started"
}

# Wait for services to be ready
wait_for_services() {
    local errors=0
    local services_ready=0
    
    log "Waiting for services to be ready..."
    
    # Wait for database
    log "Waiting for PostgreSQL..."
    local db_ready=false
    for i in {1..30}; do
        if docker-compose -f docker-compose.local.yml exec -T postgres pg_isready -U race_wars -d race_wars_dev &>/dev/null; then
            success "PostgreSQL is ready"
            db_ready=true
            services_ready=$((services_ready + 1))
            break
        fi
        sleep 2
    done
    
    if [ "$db_ready" = false ]; then
        error "PostgreSQL failed to start within timeout"
        errors=$((errors + 1))
    fi
    
    # Wait for Redis
    log "Waiting for Redis..."
    local redis_ready=false
    for i in {1..15}; do
        if docker-compose -f docker-compose.local.yml exec -T redis redis-cli ping &>/dev/null; then
            success "Redis is ready"
            redis_ready=true
            services_ready=$((services_ready + 1))
            break
        fi
        sleep 2
    done
    
    if [ "$redis_ready" = false ]; then
        error "Redis failed to start within timeout"
        errors=$((errors + 1))
    fi
    
    # Wait for application
    log "Waiting for application..."
    local app_ready=false
    for i in {1..60}; do
        if curl -f http://localhost/health &>/dev/null; then
            success "Application is ready"
            app_ready=true
            services_ready=$((services_ready + 1))
            break
        fi
        sleep 2
    done
    
    if [ "$app_ready" = false ]; then
        error "Application failed to start within timeout"
        errors=$((errors + 1))
    fi
    
    # Wait for client (if running)
    if docker-compose -f docker-compose.local.yml ps client | grep -q "Up"; then
        log "Waiting for client..."
        local client_ready=false
        for i in {1..45}; do
            if curl -f http://localhost:3000 &>/dev/null; then
                success "Client is ready"
                client_ready=true
                services_ready=$((services_ready + 1))
                break
            fi
            sleep 2
        done
        
        if [ "$client_ready" = false ]; then
            error "Client failed to start within timeout"
            errors=$((errors + 1))
        fi
    fi
    
    # Wait for monitoring services (if enabled)
    if [ "$INCLUDE_MONITORING" = "true" ]; then
        # Wait for Prometheus
        if docker-compose -f docker-compose.local.yml ps prometheus | grep -q "Up"; then
            log "Waiting for Prometheus..."
            local prometheus_ready=false
            for i in {1..30}; do
                if curl -f http://localhost:9090/-/healthy &>/dev/null; then
                    success "Prometheus is ready"
                    prometheus_ready=true
                    services_ready=$((services_ready + 1))
                    break
                fi
                sleep 2
            done
            
            if [ "$prometheus_ready" = false ]; then
                error "Prometheus failed to start within timeout"
                errors=$((errors + 1))
            fi
        fi
        
        # Wait for Grafana
        if docker-compose -f docker-compose.local.yml ps grafana | grep -q "Up"; then
            log "Waiting for Grafana..."
            local grafana_ready=false
            for i in {1..30}; do
                if curl -f http://localhost:3001/api/health &>/dev/null; then
                    success "Grafana is ready"
                    grafana_ready=true
                    services_ready=$((services_ready + 1))
                    break
                fi
                sleep 2
            done
            
            if [ "$grafana_ready" = false ]; then
                error "Grafana failed to start within timeout"
                errors=$((errors + 1))
            fi
        fi
    fi
    
    # Report final status
    echo ""
    if [ $errors -eq 0 ]; then
        success "All $services_ready services are ready! 🎉"
    else
        error "$errors services failed to start. Check logs for details:"
        echo "  docker-compose -f docker-compose.local.yml logs"
        exit 1
    fi
}

# Show service status
show_status() {
    log "Service status:"
    docker-compose -f docker-compose.local.yml ps
}

# Show access information
show_access_info() {
    echo ""
    echo -e "${GREEN}🚀 Development Environment Ready!${NC}"
    echo ""
    echo -e "${BLUE}📱 Application:${NC}"
    echo -e "  • Main App: ${YELLOW}http://localhost${NC}"
    echo -e "  • API: ${YELLOW}http://localhost/api${NC}"
    echo -e "  • WebSocket: ${YELLOW}ws://localhost/ws${NC}"
    echo -e "  • Health: ${YELLOW}http://localhost/health${NC}"
    
    if [ "$INCLUDE_MONITORING" = "true" ]; then
        echo ""
        echo -e "${BLUE}📊 Monitoring:${NC}"
        echo -e "  • Prometheus: ${YELLOW}http://localhost:9090${NC}"
        echo -e "  • Grafana: ${YELLOW}http://localhost:3001${NC} (admin/admin)"
    fi
    
    if [ "$INCLUDE_ADMIN" = "true" ]; then
        echo ""
        echo -e "${BLUE}🔧 Admin Tools:${NC}"
        echo -e "  • pgAdmin: ${YELLOW}http://localhost:5050${NC} (admin@racewars.local/admin)"
        echo -e "  • Redis Commander: ${YELLOW}http://localhost:8082${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}💾 Database:${NC}"
    echo -e "  • PostgreSQL: ${YELLOW}localhost:5432${NC} (race_wars/race_wars_dev)"
    echo -e "  • Redis: ${YELLOW}localhost:6379${NC}"
    
    echo ""
    echo -e "${BLUE}🛠️ Useful Commands:${NC}"
    echo -e "  • View logs: ${YELLOW}docker-compose -f docker-compose.local.yml logs -f${NC}"
    echo -e "  • Stop all: ${YELLOW}docker-compose -f docker-compose.local.yml down${NC}"
    echo -e "  • Restart: ${YELLOW}docker-compose -f docker-compose.local.yml restart${NC}"
    echo -e "  • Server shell: ${YELLOW}docker-compose -f docker-compose.local.yml exec server sh${NC}"
    echo -e "  • Database shell: ${YELLOW}docker-compose -f docker-compose.local.yml exec postgres psql -U race_wars -d race_wars_dev${NC}"
    
    echo ""
    echo -e "${GREEN}✨ Happy coding!${NC}"
}

# Main function
main() {
    show_banner
    check_environment
    start_services
    wait_for_services
    show_status
    show_access_info
}

# Handle script interruption
trap 'error "Startup interrupted"' INT TERM

# Parse arguments
case "$1" in
    "--monitoring"|"--mon")
        INCLUDE_MONITORING=true
        ;;
    "--admin"|"--tools")
        INCLUDE_ADMIN=true
        ;;
    "--all"|"-a")
        INCLUDE_MONITORING=true
        INCLUDE_ADMIN=true
        ;;
    "--help"|"-h")
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --monitoring, --mon    Include monitoring tools (Prometheus, Grafana)"
        echo "  --admin, --tools      Include admin tools (pgAdmin, Redis Commander)"
        echo "  --all, -a             Include all optional tools"
        echo "  --help, -h            Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Core services only"
        echo "  $0 --monitoring      # With monitoring"
        echo "  $0 --admin           # With admin tools"
        echo "  $0 --all             # With everything"
        exit 0
        ;;
esac

# Run main function
main "$@"

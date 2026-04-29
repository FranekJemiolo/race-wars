#!/bin/bash

# Local Development Teardown Script
# Usage: ./scripts/local-teardown.sh [options]

set -e

# Configuration
REMOVE_VOLUMES=${1:-false}
REMOVE_IMAGES=${2:-false}

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

# Stop and remove containers
stop_containers() {
    log "Stopping and removing containers..."
    
    # Stop all services
    docker-compose -f docker-compose.local.yml down
    
    # Stop monitoring services if running
    docker-compose -f docker-compose.local.yml --profile monitoring down 2>/dev/null || true
    
    # Stop admin services if running
    docker-compose -f docker-compose.local.yml --profile admin down 2>/dev/null || true
    
    success "Containers stopped and removed"
}

# Remove volumes (optional)
remove_volumes() {
    if [ "$REMOVE_VOLUMES" = "true" ]; then
        log "Removing volumes..."
        
        # Remove volumes
        docker-compose -f docker-compose.local.yml down -v
        
        # Remove specific volumes
        docker volume rm race-wars_postgres_local_data 2>/dev/null || true
        docker volume rm race-wars_redis_local_data 2>/dev/null || true
        docker volume rm race-wars_prometheus_local_data 2>/dev/null || true
        docker volume rm race-wars_grafana_local_data 2>/dev/null || true
        docker volume rm race-wars_pgadmin_local_data 2>/dev/null || true
        
        success "Volumes removed"
    else
        log "Volumes preserved (use --remove-volumes to remove)"
    fi
}

# Remove images (optional)
remove_images() {
    if [ "$REMOVE_IMAGES" = "true" ]; then
        log "Removing Docker images..."
        
        # Remove built images
        docker rmi race-wars-server:dev 2>/dev/null || true
        docker rmi race-wars-client:dev 2>/dev/null || true
        
        # Remove dangling images
        docker image prune -f
        
        success "Docker images removed"
    else
        log "Docker images preserved (use --remove-images to remove)"
    fi
}

# Clean up logs and temporary files
cleanup_files() {
    log "Cleaning up temporary files..."
    
    # Clean up log files
    find ./infrastructure/nginx/logs -name "*.log" -delete 2>/dev/null || true
    find ./logs -name "*.log" -delete 2>/dev/null || true
    
    # Clean up temporary files
    rm -f ./logs/deploy_*.log 2>/dev/null || true
    rm -f ./logs/ssl-renewal.log 2>/dev/null || true
    
    success "Temporary files cleaned up"
}

# Show summary
show_summary() {
    log "Local development environment teardown completed!"
    echo ""
    echo -e "${GREEN}Status:${NC}"
    echo -e "  • All services: ${BLUE}Stopped${NC}"
    
    if [ "$REMOVE_VOLUMES" = "true" ]; then
        echo -e "  • Volumes: ${BLUE}Removed${NC}"
    else
        echo -e "  • Volumes: ${YELLOW}Preserved${NC}"
    fi
    
    if [ "$REMOVE_IMAGES" = "true" ]; then
        echo -e "  • Images: ${BLUE}Removed${NC}"
    else
        echo -e "  • Images: ${YELLOW}Preserved${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}To restart:${NC}"
    echo -e "  • Basic setup: ${BLUE}./scripts/local-setup.sh${NC}"
    echo -e "  • With monitoring: ${BLUE}./scripts/local-setup.sh true${NC}"
    echo -e "  • With admin tools: ${BLUE}./scripts/local-setup.sh true true${NC}"
}

# Main teardown function
main() {
    log "Starting local development teardown..."
    
    # Parse arguments
    case "$1" in
        "--remove-volumes")
            REMOVE_VOLUMES=true
            ;;
        "--remove-images")
            REMOVE_IMAGES=true
            ;;
        "--clean-all")
            REMOVE_VOLUMES=true
            REMOVE_IMAGES=true
            ;;
    esac
    
    stop_containers
    remove_volumes
    remove_images
    cleanup_files
    show_summary
    
    success "Teardown completed!"
}

# Handle script interruption
trap 'error "Teardown interrupted"' INT TERM

# Run main function
main "$@"

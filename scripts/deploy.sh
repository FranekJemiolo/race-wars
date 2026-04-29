#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./logs/deploy_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        error "Environment file .env.$ENVIRONMENT does not exist"
    fi
    
    # Check required directories
    mkdir -p backups logs infrastructure/nginx/ssl infrastructure/nginx/logs
    
    success "Prerequisites check passed"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
        # Backup database
        log "Backing up database..."
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/database.sql"
        
        # Backup current images
        log "Backing up Docker images..."
        docker save race-wars-server:latest > "$BACKUP_DIR/server-image.tar" 2>/dev/null || true
        
        success "Backup completed: $BACKUP_DIR"
    else
        warning "No running deployment found, skipping backup"
    fi
}

# Build new images
build_images() {
    log "Building Docker images..."
    
    # Build production image
    docker build -f Dockerfile.prod -t race-wars-server:latest .
    
    success "Docker images built successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Start database only
    docker-compose -f docker-compose.prod.yml up -d postgres
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null; then
            break
        fi
        sleep 2
    done
    
    # Run migrations
    docker-compose -f docker-compose.prod.yml run --rm server npm run migrate
    
    success "Database migrations completed"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Load environment variables
    set -a
    source .env.$ENVIRONMENT
    set +a
    
    # Deploy with zero downtime
    docker-compose -f docker-compose.prod.yml up -d --no-deps server
    
    # Wait for health check
    log "Waiting for application to be healthy..."
    for i in {1..60}; do
        if curl -f http://localhost:8080/health &>/dev/null; then
            break
        fi
        sleep 2
    done
    
    success "Application deployed successfully"
}

# Update reverse proxy
update_proxy() {
    log "Updating reverse proxy..."
    
    # Reload Nginx configuration
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    success "Reverse proxy updated"
}

# Post-deployment verification
verify_deployment() {
    log "Verifying deployment..."
    
    # Check application health
    if ! curl -f http://localhost/health &>/dev/null; then
        error "Health check failed"
    fi
    
    # Check database connectivity
    if ! docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null; then
        error "Database health check failed"
    fi
    
    # Check Redis connectivity
    if ! docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping &>/dev/null; then
        error "Redis health check failed"
    fi
    
    success "Deployment verification passed"
}

# Cleanup old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old backups (keep last 5)
    find ./backups -name "*.sql" -type f | sort -r | tail -n +6 | xargs rm -f
    
    success "Cleanup completed"
}

# Main deployment flow
main() {
    log "Starting deployment to $ENVIRONMENT environment..."
    
    check_prerequisites
    backup_current
    build_images
    run_migrations
    deploy_application
    update_proxy
    verify_deployment
    cleanup
    
    success "Deployment to $ENVIRONMENT completed successfully!"
    log "Deployment log: $LOG_FILE"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"

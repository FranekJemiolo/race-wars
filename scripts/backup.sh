#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup.sh [type] [retention_days]

set -e

# Configuration
BACKUP_TYPE=${1:-full}
RETENTION_DAYS=${2:-7}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME=${DB_NAME:-race_wars_prod}
DB_USER=${DB_USER:-race_wars_user}

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

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/files"
    mkdir -p "$BACKUP_DIR/logs"
}

# Database backup
backup_database() {
    log "Starting database backup..."
    
    local backup_file="$BACKUP_DIR/database/db_backup_$TIMESTAMP.sql"
    
    if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        # Create database backup
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$backup_file"
        
        # Compress backup
        gzip "$backup_file"
        
        # Create checksum
        sha256sum "${backup_file}.gz" > "${backup_file}.gz.sha256"
        
        success "Database backup completed: ${backup_file}.gz"
    else
        error "PostgreSQL container is not running"
    fi
}

# File backup
backup_files() {
    log "Starting file backup..."
    
    local files_backup="$BACKUP_DIR/files/files_backup_$TIMESTAMP.tar.gz"
    
    # Backup uploaded files
    if [ -d "./uploads" ]; then
        tar -czf "$files_backup" ./uploads
        success "File backup completed: $files_backup"
    else
        warning "No files directory found, skipping file backup"
    fi
}

# Configuration backup
backup_config() {
    log "Starting configuration backup..."
    
    local config_backup="$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz"
    
    # Backup configuration files
    tar -czf "$config_backup" \
        .env.production \
        docker-compose.prod.yml \
        infrastructure/ \
        scripts/ \
        --exclude='infrastructure/nginx/ssl' \
        --exclude='infrastructure/nginx/logs'
    
    success "Configuration backup completed: $config_backup"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Remove old database backups
    find "$BACKUP_DIR/database" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/database" -name "*.sha256" -mtime +$RETENTION_DAYS -delete
    
    # Remove old file backups
    find "$BACKUP_DIR/files" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # Remove old config backups
    find "$BACKUP_DIR" -name "config_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    success "Old backups cleaned up"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Verify database backup
    local db_backup=$(find "$BACKUP_DIR/database" -name "db_backup_$TIMESTAMP.sql.gz" | head -1)
    if [ -f "$db_backup" ]; then
        # Check checksum
        if sha256sum -c "${db_backup}.sha256" &>/dev/null; then
            success "Database backup integrity verified"
        else
            error "Database backup integrity check failed"
        fi
    fi
}

# Main backup function
main() {
    log "Starting $BACKUP_TYPE backup..."
    
    create_backup_dir
    
    case "$BACKUP_TYPE" in
        "database")
            backup_database
            ;;
        "files")
            backup_files
            ;;
        "config")
            backup_config
            ;;
        "full")
            backup_database
            backup_files
            backup_config
            ;;
        *)
            error "Invalid backup type. Use: database, files, config, or full"
            ;;
    esac
    
    verify_backup
    cleanup_old_backups
    
    success "Backup completed successfully!"
}

# Handle script interruption
trap 'error "Backup interrupted"' INT TERM

# Run main function
main "$@"

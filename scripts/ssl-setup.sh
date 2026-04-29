#!/bin/bash

# SSL Certificate Setup Script (Let's Encrypt)
# Usage: ./scripts/ssl-setup.sh [domain]

set -e

# Configuration
DOMAIN=${1:-racewars.com}
EMAIL=${2:-admin@racewars.com}
SSL_DIR="./infrastructure/nginx/ssl"

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
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Create SSL directory
    mkdir -p "$SSL_DIR"
    
    success "Prerequisites check passed"
}

# Generate self-signed certificate (for development)
generate_self_signed() {
    log "Generating self-signed certificate for development..."
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate signing request
    openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/csr.pem" -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    # Generate self-signed certificate
    openssl x509 -req -days 365 -in "$SSL_DIR/csr.pem" -signkey "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem"
    
    # Clean up CSR
    rm "$SSL_DIR/csr.pem"
    
    success "Self-signed certificate generated"
}

# Obtain Let's Encrypt certificate
obtain_lets_encrypt() {
    log "Obtaining Let's Encrypt certificate for $DOMAIN..."
    
    # Check if domain is accessible
    if ! curl -f "http://$DOMAIN" &>/dev/null; then
        error "Domain $DOMAIN is not accessible from this server"
    fi
    
    # Obtain certificate
    sudo certbot certonly --nginx --non-interactive --agree-tos --email "$EMAIL" -d "$DOMAIN"
    
    # Copy certificates to SSL directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    sudo chown $(whoami):$(whoami) "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem"
    
    success "Let's Encrypt certificate obtained"
}

# Setup auto-renewal
setup_auto_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > "./scripts/ssl-renew.sh" << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script
DOMAIN="racewars.com"
SSL_DIR="./infrastructure/nginx/ssl"

# Renew certificate
sudo certbot renew --quiet

# Copy renewed certificates
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    sudo chown $(whoami):$(whoami) "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem"
    
    # Reload nginx
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    echo "Certificate renewed and nginx reloaded"
fi
EOF
    
    chmod +x "./scripts/ssl-renew.sh"
    
    # Add cron job for renewal
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/ssl-renew.sh >> $(pwd)/logs/ssl-renewal.log 2>&1") | crontab -
    
    success "Auto-renewal setup completed"
}

# Test certificate
test_certificate() {
    log "Testing SSL certificate..."
    
    # Check certificate validity
    if openssl x509 -in "$SSL_DIR/cert.pem" -noout -dates; then
        success "Certificate is valid"
    else
        error "Certificate is invalid"
    fi
    
    # Test nginx configuration
    if docker-compose -f docker-compose.prod.yml exec nginx nginx -t; then
        success "Nginx configuration is valid"
    else
        error "Nginx configuration is invalid"
    fi
}

# Main function
main() {
    log "Starting SSL setup for $DOMAIN..."
    
    check_prerequisites
    
    # Check if this is development or production
    if [[ "$DOMAIN" == *"localhost"* || "$DOMAIN" == *"dev"* ]]; then
        generate_self_signed
    else
        obtain_lets_encrypt
        setup_auto_renewal
    fi
    
    test_certificate
    
    success "SSL setup completed for $DOMAIN!"
}

# Handle script interruption
trap 'error "SSL setup interrupted"' INT TERM

# Run main function
main "$@"

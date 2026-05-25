#!/bin/bash

# 🎯 REVOLUTIONARY LAUNCH: Backup Creation Script

set -e

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$BACKUP_DIR/backup.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "🎯 Starting Revolutionary Launch Backup"
echo "Backup Directory: $BACKUP_DIR" >> "$LOG_FILE"

# Application code backup
log "📦 Backing up application code..."
cp -r src "$BACKUP_DIR/"
cp -r public "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp *.config.* "$BACKUP_DIR/" 2>/dev/null || true
success "Application code backed up"

# Build artifacts backup
if [ -d "dist" ]; then
    log "🏗️  Backing up build artifacts..."
    cp -r dist "$BACKUP_DIR/"
    success "Build artifacts backed up"
fi

# Environment configuration backup (without secrets)
log "🔐 Backing up environment configuration..."
cp .env.example "$BACKUP_DIR/" 2>/dev/null || true
# Note: .env files contain secrets and should not be backed up to version control

# Database schema backup
if command -v supabase &> /dev/null; then
    log "🗄️  Backing up database schema..."
    supabase db dump --schema-only > "$BACKUP_DIR/schema.sql" 2>> "$LOG_FILE"
    success "Database schema backed up"
fi

# Extended sales copy data backup
if [ -f "src/data/extendedSalesCopy.ts" ]; then
    log "📄 Backing up sales copy data..."
    cp src/data/extendedSalesCopy.ts "$BACKUP_DIR/"
    success "Sales copy data backed up"
fi

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "components": [
    "application_code",
    "build_artifacts",
    "database_schema",
    "sales_copy_data"
  ],
  "purpose": "Revolutionary Launch: Card Tile & Modal Experience",
  "rollback_instructions": "1. Restore files from backup directory\n2. Run 'npm install'\n3. Run 'npm run build'\n4. Deploy to production"
}
EOF

success "Backup manifest created"

# Compress backup
log "📦 Compressing backup..."
cd backups
tar -czf "$(basename "$BACKUP_DIR")".tar.gz "$(basename "$BACKUP_DIR")" 2>> "$LOG_FILE"
cd ..
success "Backup compressed"

# Cleanup old backups (keep last 10)
log "🧹 Cleaning up old backups..."
cd backups
ls -t *.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
cd ..
success "Old backups cleaned up"

log "🎉 Backup completed successfully!"
echo ""
echo "Backup Location: $BACKUP_DIR"
echo "Compressed Archive: $BACKUP_DIR.tar.gz"
echo "Log File: $LOG_FILE"
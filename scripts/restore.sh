#!/bin/bash
# scripts/restore.sh
# Restores a backup of the SQLite database.

DB_PATH="./prisma/dev.db"

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file_path>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found at $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will overwrite the current database."
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore aborted."
    exit 1
fi

# Stop the application container before restoring
echo "Stopping mdz-os-app container to prevent data corruption during restore..."
docker stop mdz-os-app || true

# Copy backup to live location
cp "$BACKUP_FILE" "$DB_PATH"

echo "Database restored successfully."
echo "Starting mdz-os-app container..."
docker start mdz-os-app

echo "Restore complete!"

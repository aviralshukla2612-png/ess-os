#!/bin/bash
# scripts/backup.sh
# Creates a snapshot backup of the SQLite database.

BACKUP_DIR="./backups"
DB_PATH="./prisma/dev.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dev_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

# We use the SQLite online backup API to ensure a safe copy while the DB is in use
echo "Creating backup..."
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ $? -eq 0 ]; then
    echo "Backup created successfully at $BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi

# ESS OS Production Configuration & Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Nginx (if reverse proxying)
- Node.js 20+ (for local builds)

## Environment Configuration
Copy `.env.example` to `.env` and fill in the values:
- `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`. Keep secret.
- `NEXTAUTH_URL`: e.g. `https://your-domain.com/ess-os`
- `NODE_ENV`: Set to `production`
- `DATABASE_URL`: Typically `file:./prod.db` for SQLite or external DB URL.

**WARNING: Never commit `.env` containing production credentials.**

## Deployment Architecture
ESS OS is containerized and served behind an Nginx reverse proxy using the `basePath: "/ess-os"`. 
- **Docker Startup**: Run `docker-compose up -d --build` to launch the application.
- **Production Build**: Run `npm run build` locally or let the Dockerfile handle it. The standalone output minimizes the image size.
- **Nginx Configuration**: Proxy requests from `/ess-os` to the Docker container (port 3040 by default).
- **Health Endpoint**: Monitor `/ess-os/api/health` (returns `{"status":"ok","database":"ok"}`) for liveness probes.

## Database Persistence & Backup
SQLite databases must persist outside the container.
- Ensure the `prisma/` directory is mapped to a named volume or host path in `docker-compose.yml`.
- **Backup Procedure**: 
  - The `scripts/backup.ps1` (or `backup.sh`) creates a timestamped copy of the SQLite database.
  - Store backups securely (e.g. offsite or S3).
- **Restore Procedure**:
  - Stop the container.
  - Replace the active `.db` file with the backup.
  - Restart the container. Verify data via the UI.

## Rollback Procedure
If a deployment fails:
1. Revert the repository to the previous working tag.
2. If schema changes occurred, restore the pre-deployment database backup.
3. Re-run `docker-compose up -d --build`.
